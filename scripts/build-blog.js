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
const SITE_URL='https://www.barcelonamontessorischool.com';

const fmtDate=iso=>{const d=new Date(iso+'T00:00:00');return isNaN(d)?iso:`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const imgPost=p=>{p=String(p||'').replace(/^\//,'');return p?'../'+p:'';};
const imgIndex=p=>String(p||'').replace(/^\//,'');
const firstPara=md=>{let t=md.trim().split(/\n\s*\n/)[0].replace(/[*_`]/g,'').replace(/^[#>\-\s]+/,'').trim();return t.length>190?t.slice(0,187).trim()+'…':t;};


function shareButtons(title, url){
  const t=encodeURIComponent(title), u=encodeURIComponent(url);
  const links=[
    {name:'Facebook', href:`https://www.facebook.com/sharer/sharer.php?u=${u}`,
     icon:'<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.7c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.5h-1.2c-1.2 0-1.6.7-1.6 1.5v1.8H16l-.4 2.9h-2.1v7A10 10 0 0 0 22 12z"/>'},
    {name:'X (Twitter)', href:`https://twitter.com/intent/tweet?url=${u}&text=${t}`,
     icon:'<path d="M18.9 3H21l-6.4 7.3L21.7 21h-6.1l-4.8-6.2L5 21H2.8l6.9-7.8L2.4 3h6.2l4.3 5.7L18.9 3zm-2.1 16h1.7L8.3 4.9H6.5L16.8 19z"/>'},
    {name:'WhatsApp', href:`https://wa.me/?text=${t}%20${u}`,
     icon:'<path d="M20 3.9A11 11 0 0 0 3.5 18L2 22l4.2-1.4A11 11 0 1 0 20 3.9zM12 20a8.9 8.9 0 0 1-4.5-1.2l-.3-.2-3 1 1-2.9-.2-.3A8.9 8.9 0 1 1 12 20zm4.9-6.6c-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1s-.7.9-.9 1.1c-.2.2-.3.2-.6.1-.9-.4-1.8-1-2.5-1.8-.6-.7-.9-1.2-1.1-1.5-.1-.3 0-.4.1-.6.2-.2.4-.4.6-.6.1-.1.2-.3.1-.5-.1-.3-.7-1.6-.9-2.1-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.3.3-1 1-.9 2.4 0 1.4 1 2.8 1.1 3 .1.2 1.9 3 4.7 4.1 2.7 1.1 2.7.7 3.2.7.5 0 1.6-.6 1.9-1.3.2-.6.2-1.1.2-1.2 0-.1-.2-.2-.5-.3z"/>'},
    {name:'LinkedIn', href:`https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
     icon:'<path d="M6.9 8.4H3.3V21h3.6V8.4zM5.1 3a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2zM21 21v-7c0-3.4-1.8-5-4.3-5-2 0-2.8 1.1-3.3 1.9V8.4H10v12.6h3.4v-7c0-.4 0-.7.1-.9.3-.7.9-1.4 1.9-1.4 1.3 0 1.9 1 1.9 2.5v6.8H21z"/>'},
    {name:'Email', href:`mailto:?subject=${t}&body=${u}`,
     icon:'<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2 7.1 5.6a1 1 0 0 0 1 0L20.6 7H4.4zM21 8.4l-7 5.5a3 3 0 0 1-3.7 0L3 8.4V17h18V8.4z"/>'},
  ];
  const items = links.map(l=>`<a class="blog-share-link" href="${l.href}" target="_blank" rel="noopener" aria-label="Share on ${l.name}"><svg viewBox="0 0 24 24">${l.icon}</svg></a>`).join('');
  return `<div class="blog-share"><span class="blog-share-label">Share</span>${items}</div>`;
}

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
    .split('{{SHARE}}').join(shareButtons(d.title, `${SITE_URL}/blog/${p.slug}.html`))
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
