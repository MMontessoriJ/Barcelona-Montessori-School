/* BMS blog build: markdown (content/blog/*.md) -> blog/<slug>.html + index.html cards.
   Run by Netlify via `npm run build`. No framework; just gray-matter + marked. */
const fs=require('fs'), path=require('path');
const matter=require('gray-matter');
const {marked}=require('marked');

const ROOT=path.join(__dirname,'..');
const CONTENT=path.join(ROOT,'content','blog');
const TEMPLATE=fs.readFileSync(path.join(__dirname,'post-template.html'),'utf8');
const INDEX=path.join(ROOT,'index.html');
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate=iso=>{const d=new Date(iso+'T00:00:00');return isNaN(d)?iso:`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const imgPost=p=>{p=String(p||'').replace(/^\//,'');return p?'../'+p:'';};
const imgIndex=p=>String(p||'').replace(/^\//,'');
const firstPara=md=>{let t=md.trim().split(/\n\s*\n/)[0].replace(/[*_`]/g,'').replace(/^[#>\-\s]+/,'').trim();return t.length>190?t.slice(0,187).trim()+'…':t;};

if(!fs.existsSync(CONTENT)){console.error('No content/blog directory');process.exit(1);}
const posts=fs.readdirSync(CONTENT).filter(f=>/\.md$/.test(f)).map(f=>{
  const slug=f.replace(/\.md$/,'');
  const g=matter(fs.readFileSync(path.join(CONTENT,f),'utf8'));
  return {slug,data:g.data,body:g.content};
}).sort((a,b)=> (String(a.data.date)<String(b.data.date)?1:-1));

for(const p of posts){
  const d=p.data;
  const hero=d.hero?`<figure class="blog-article-hero"><img alt="${esc(d.hero_alt||d.title)}" loading="lazy" src="${imgPost(d.hero)}"/>`+(d.hero_caption?`<figcaption>${esc(d.hero_caption)}</figcaption>`:'')+`</figure>`:'';
  const gallery=(Array.isArray(d.gallery)&&d.gallery.length)?'<div class="blog-article-gallery">'+d.gallery.map(g=>`<figure><img alt="${esc(g.alt||'')}" loading="lazy" src="${imgPost(g.image)}"/>`+(g.caption?`<figcaption>${esc(g.caption)}</figcaption>`:'')+`</figure>`).join('')+'</div>':'';
  const meta=`${fmtDate(d.date)} · Written by ${esc(d.author||'Barcelona Montessori School')}`;
  const html=TEMPLATE
    .split('{{TITLE}}').join(esc(d.title))
    .split('{{DESCRIPTION}}').join(esc(d.description||d.title))
    .split('{{SLUG}}').join(p.slug)
    .split('{{CATEGORY}}').join(esc(d.category||'News'))
    .split('{{META}}').join(meta)
    .split('{{HERO}}').join(hero)
    .split('{{GALLERY}}').join(gallery)
    .split('{{BODY}}').join(marked.parse(p.body.trim()));
  fs.writeFileSync(path.join(ROOT,'blog',p.slug+'.html'),html);
  console.log('wrote blog/'+p.slug+'.html');
}

const cards=posts.map(p=>{const d=p.data;const excerpt=esc(firstPara(p.body));const thumb=d.hero?`<img alt="${esc(d.hero_alt||d.title)}" loading="lazy" src="${imgIndex(d.hero)}"/>`:'';
return `<article class="blog-card reveal" id="${p.slug}">
<div class="blog-thumb">${thumb}</div>
<div class="blog-body">
<div class="blog-cat">${esc(d.category||'News')}</div>
<h3 class="blog-title">${esc(d.title)}</h3>
<div class="blog-date">${fmtDate(d.date)} · Written by ${esc(d.author||'BMS')}</div>
<p class="blog-excerpt">${excerpt}</p>
<a class="btn btn-outline blog-read" href="blog/${p.slug}.html" target="_self">Read full article →</a>
</div>
</article>`;}).join('\n');

let idx=fs.readFileSync(INDEX,'utf8');
const re=/<!-- BLOG:CARDS:START -->[\s\S]*?<!-- BLOG:CARDS:END -->/;
if(re.test(idx)){idx=idx.replace(re,'<!-- BLOG:CARDS:START -->\n'+cards+'\n<!-- BLOG:CARDS:END -->');fs.writeFileSync(INDEX,idx);console.log('index.html: regenerated '+posts.length+' cards');}
else console.warn('WARNING: BLOG:CARDS markers not found in index.html — cards not updated');
