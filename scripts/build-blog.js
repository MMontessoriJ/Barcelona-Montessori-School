/* BMS blog build: markdown (content/blog/*.md) -> blog/<slug>.html + index.html cards.
   Also generates translated blog pages from content/blog/<locale>/*.md (fr/es/ca),
   which supply translated title/description/body only — all other fields (date,
   author, category, hero, gallery images) are reused from the English source post.
   Run by Netlify via `npm run build`. No framework; just gray-matter + marked. */
const fs=require('fs'), path=require('path');
const matter=require('gray-matter');
const {marked}=require('marked');

const ROOT=path.join(__dirname,'..');
const CONTENT=path.join(ROOT,'content','blog');
const TEMPLATE=fs.readFileSync(path.join(__dirname,'post-template.html'),'utf8');
const SITE_URL='https://www.barcelonamontessorischool.com';

const LOCALES=['en','fr','es','ca'];

const MONTHS={
  en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  fr:['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'],
  es:['ene.','feb.','mar.','abr.','may.','jun.','jul.','ago.','sept.','oct.','nov.','dic.'],
  ca:['gen.','feb.','març','abr.','maig','juny','jul.','ag.','set.','oct.','nov.','des.'],
};

const CATEGORY_LABELS={
  en:{Community:'Community','School Life':'School Life',Arts:'Arts',Celebrations:'Celebrations',Montessori:'Montessori',Events:'Events',News:'News'},
  fr:{Community:'Communauté','School Life':'Vie scolaire',Arts:'Arts',Celebrations:'Célébrations',Montessori:'Montessori',Events:'Événements',News:'Actualités'},
  es:{Community:'Comunidad','School Life':'Vida escolar',Arts:'Arte',Celebrations:'Celebraciones',Montessori:'Montessori',Events:'Eventos',News:'Noticias'},
  ca:{Community:'Comunitat','School Life':'Vida escolar',Arts:'Art',Celebrations:'Celebracions',Montessori:'Montessori',Events:'Esdeveniments',News:'Notícies'},
};

// UI strings + nav labels for each locale. Machine-translated to match the
// same quality bar as the rest of the translated site (Weglot).
const STRINGS={
  en:{
    announce:'Admissions open for 2026–27 · Visit our campuses in Sarrià',
    navAbout:'About', navProgrammes:'Programmes', navAdmissions:'Admissions', navLife:'Life at BMS',
    navBlog:'Blog', navContact:'Contact', navInterest:'More Information',
    backLink:'← Back to all blog posts',
    publishedLabel:'Published', writtenByLabel:'Written by', categoryLabel:'Category',
    articleLabel:'Article', allPostsLabel:'All blog posts', shareLabel:'Share article', bookVisitLabel:'Book a visit',
    nextStepsLabel:'Next steps', exploreProgrammesLabel:'Explore programmes',
    admissionsProcessLabel:'Admissions process', contactSchoolLabel:'Contact the school',
    ctaTitle:'Interested in Barcelona Montessori School?',
    ctaText:'Tell us what you are looking for and our team will guide you through the next steps.',
    ctaBtn:'Complete the interest form',
    relProgTag:'Programme', relProgTitle:'Explore our Montessori pathways',
    relProgText:'From Nido to the Adolescent Programme, discover how each environment supports independence and growth.',
    relLifeTag:'Life at BMS', relLifeTitle:'Learning beyond the classroom',
    relLifeText:'Outdoor work, community life and responsibility are part of the rhythm of school life.',
    relAdmTag:'Admissions', relAdmTitle:'Book a visit',
    relAdmText:'Tell us what you are looking for and we will guide you through the next steps.',
    footerPrivacy:'Privacy', footerTerms:'Terms', footerContact:'Contact',
    writtenByMeta:'Written by',
  },
  fr:{
    announce:'Admissions ouvertes pour 2026-27 · Visitez nos campus à Sarrià',
    navAbout:'À propos', navProgrammes:'Programmes', navAdmissions:'Admissions', navLife:'Vie à BMS',
    navBlog:'Blog', navContact:'Contact', navInterest:'Plus d\'informations',
    backLink:'← Retour à tous les articles',
    publishedLabel:'Publié', writtenByLabel:'Écrit par', categoryLabel:'Catégorie',
    articleLabel:'Article', allPostsLabel:'Tous les articles', shareLabel:'Partager l\'article', bookVisitLabel:'Réserver une visite',
    nextStepsLabel:'Prochaines étapes', exploreProgrammesLabel:'Découvrir nos programmes',
    admissionsProcessLabel:'Processus d\'admission', contactSchoolLabel:'Contacter l\'école',
    ctaTitle:'Intéressé par Barcelona Montessori School ?',
    ctaText:'Dites-nous ce que vous recherchez et notre équipe vous guidera dans les prochaines étapes.',
    ctaBtn:'Remplir le formulaire d\'intérêt',
    relProgTag:'Programme', relProgTitle:'Découvrez nos parcours Montessori',
    relProgText:'De Nido au Programme Adolescent, découvrez comment chaque environnement soutient l\'indépendance et la croissance.',
    relLifeTag:'Vie à BMS', relLifeTitle:'Apprendre au-delà de la salle de classe',
    relLifeText:'Le travail en extérieur, la vie communautaire et la responsabilité font partie du rythme de la vie scolaire.',
    relAdmTag:'Admissions', relAdmTitle:'Réserver une visite',
    relAdmText:'Dites-nous ce que vous recherchez et nous vous guiderons dans les prochaines étapes.',
    footerPrivacy:'Confidentialité', footerTerms:'Conditions', footerContact:'Contact',
    writtenByMeta:'Écrit par',
  },
  es:{
    announce:'Admisiones abiertas para 2026-27 · Visite nuestros campus en Sarrià',
    navAbout:'Quiénes somos', navProgrammes:'Programas', navAdmissions:'Admisiones', navLife:'Vida en BMS',
    navBlog:'Blog', navContact:'Contacto', navInterest:'Más información',
    backLink:'← Volver a todos los artículos',
    publishedLabel:'Publicado', writtenByLabel:'Escrito por', categoryLabel:'Categoría',
    articleLabel:'Artículo', allPostsLabel:'Todos los artículos', shareLabel:'Compartir artículo', bookVisitLabel:'Reservar una visita',
    nextStepsLabel:'Próximos pasos', exploreProgrammesLabel:'Explorar programas',
    admissionsProcessLabel:'Proceso de admisión', contactSchoolLabel:'Contactar con la escuela',
    ctaTitle:'¿Interesado en Barcelona Montessori School?',
    ctaText:'Cuéntanos qué buscas y nuestro equipo te guiará en los próximos pasos.',
    ctaBtn:'Rellenar el formulario de interés',
    relProgTag:'Programa', relProgTitle:'Explora nuestros itinerarios Montessori',
    relProgText:'Desde Nido hasta el Programa de Adolescentes, descubre cómo cada entorno apoya la independencia y el crecimiento.',
    relLifeTag:'Vida en BMS', relLifeTitle:'Aprender más allá del aula',
    relLifeText:'El trabajo al aire libre, la vida en comunidad y la responsabilidad forman parte del ritmo de la vida escolar.',
    relAdmTag:'Admisiones', relAdmTitle:'Reservar una visita',
    relAdmText:'Cuéntanos qué buscas y te guiaremos en los próximos pasos.',
    footerPrivacy:'Privacidad', footerTerms:'Términos', footerContact:'Contacto',
    writtenByMeta:'Escrito por',
  },
  ca:{
    announce:'Admissions obertes per al 2026-27 · Visiteu els nostres campus a Sarrià',
    navAbout:'Sobre nosaltres', navProgrammes:'Programes', navAdmissions:'Admissions', navLife:'Vida a BMS',
    navBlog:'Blog', navContact:'Contacte', navInterest:'Més informació',
    backLink:'← Tornar a tots els articles',
    publishedLabel:'Publicat', writtenByLabel:'Escrit per', categoryLabel:'Categoria',
    articleLabel:'Article', allPostsLabel:'Tots els articles', shareLabel:'Compartir l\'article', bookVisitLabel:'Reservar una visita',
    nextStepsLabel:'Propers passos', exploreProgrammesLabel:'Explorar els programes',
    admissionsProcessLabel:'Procés d\'admissió', contactSchoolLabel:'Contactar amb l\'escola',
    ctaTitle:'Interessat en Barcelona Montessori School?',
    ctaText:'Digues-nos què busques i el nostre equip et guiarà en els propers passos.',
    ctaBtn:'Emplenar el formulari d\'interès',
    relProgTag:'Programa', relProgTitle:'Descobreix els nostres itineraris Montessori',
    relProgText:'De Nido al Programa d\'Adolescents, descobreix com cada entorn dona suport a la independència i el creixement.',
    relLifeTag:'Vida a BMS', relLifeTitle:'Aprendre més enllà de l\'aula',
    relLifeText:'El treball a l\'aire lliure, la vida comunitària i la responsabilitat formen part del ritme de la vida escolar.',
    relAdmTag:'Admissions', relAdmTitle:'Reservar una visita',
    relAdmText:'Digues-nos què busques i et guiarem en els propers passos.',
    footerPrivacy:'Privacitat', footerTerms:'Termes', footerContact:'Contacte',
    writtenByMeta:'Escrit per',
  },
};

const fmtDate=(iso,locale)=>{const d=new Date(iso+'T00:00:00');if(isNaN(d))return iso;const m=MONTHS[locale]||MONTHS.en;return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const firstPara=md=>{let t=md.trim().split(/\n\s*\n/)[0].replace(/[*_`]/g,'').replace(/^[#>\-\s]+/,'').trim();return t.length>190?t.slice(0,187).trim()+'…':t;};
const DEFAULT_OG_IMAGE=`${SITE_URL}/images/mas-pomaret-building-at-carrer-pomaret-25-barcelon.webp`;
const ogImage=p=>p?`${SITE_URL}/${String(p).replace(/^\//,'')}`:DEFAULT_OG_IMAGE;

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

// English (source of truth for all metadata: date, author, category, hero, gallery)
const enPosts=fs.readdirSync(CONTENT).filter(f=>/\.md$/.test(f)).map(f=>{
  const slug=f.replace(/\.md$/,'');
  const g=matter(fs.readFileSync(path.join(CONTENT,f),'utf8'));
  return {slug,data:g.data,body:g.content};
}).sort((a,b)=> (String(a.data.date)<String(b.data.date)?1:-1));
const enBySlug={}; enPosts.forEach(p=>enBySlug[p.slug]=p);

function imgPost(p, depth){ p=String(p||'').replace(/^\//,''); return p ? ('../'.repeat(depth)+p) : ''; }
function imgIndex(p){ return String(p||'').replace(/^\//,''); }

function renderPost(slug, data, body, locale, depth, outDir){
  const S=STRINGS[locale]||STRINGS.en;
  const catKey=data.category||'News';
  const catLabel=(CATEGORY_LABELS[locale]&&CATEGORY_LABELS[locale][catKey])||catKey;
  const root='../'.repeat(depth);
  const localePath = locale==='en' ? '' : (locale+'/');
  const hero=data.hero?`<figure class="blog-article-hero"><img alt="${esc(data.hero_alt||data.title)}" loading="lazy" src="${imgPost(data.hero,depth)}"/>`+(data.hero_caption?`<figcaption>${esc(data.hero_caption)}</figcaption>`:'')+`</figure>`:'';
  const gallery=(Array.isArray(data.gallery)&&data.gallery.length)?'<div class="blog-article-gallery">'+data.gallery.map(g=>`<figure><img alt="${esc(g.alt||'')}" loading="lazy" src="${imgPost(g.image,depth)}"/>`+(g.caption?`<figcaption>${esc(g.caption)}</figcaption>`:'')+`</figure>`).join('')+'</div>':'';
  const meta=`${fmtDate(data.date,locale)} · ${S.writtenByMeta} ${esc(data.author||'Barcelona Montessori School')}`;
  const canonicalUrl=`${SITE_URL}/${localePath}blog/${slug}.html`;

  const html=TEMPLATE
    .split('{{HTML_LANG}}').join(locale)
    .split('{{LOCALE_PATH}}').join(localePath)
    .split('{{TITLE}}').join(esc(data.title))
    .split('{{DESCRIPTION}}').join(esc(data.description||data.title))
    .split('{{SLUG}}').join(slug)
    .split('{{CATEGORY}}').join(esc(catLabel))
    .split('{{META}}').join(meta)
    .split('{{HERO}}').join(hero)
    .split('{{GALLERY}}').join(gallery)
    .split('{{SHARE}}').join(shareButtons(data.title, canonicalUrl))
    .split('{{OGIMAGE}}').join(ogImage(data.hero))
    .split('{{PUBDATE}}').join(String(data.date))
    .split('{{AUTHOR}}').join(esc(data.author||'Barcelona Montessori School'))
    .split('{{BODY}}').join(marked.parse(body.trim()))
    .split('{{ROOT}}').join(root)
    .split('{{ANNOUNCE}}').join(S.announce)
    .split('{{NAV_ABOUT}}').join(S.navAbout)
    .split('{{NAV_PROGRAMMES}}').join(S.navProgrammes)
    .split('{{NAV_ADMISSIONS}}').join(S.navAdmissions)
    .split('{{NAV_LIFE}}').join(S.navLife)
    .split('{{NAV_BLOG}}').join(S.navBlog)
    .split('{{NAV_CONTACT}}').join(S.navContact)
    .split('{{NAV_INTEREST}}').join(S.navInterest)
    .split('{{BACK_LINK}}').join(S.backLink)
    .split('{{PUBLISHED_LABEL}}').join(S.publishedLabel)
    .split('{{WRITTEN_BY_LABEL}}').join(S.writtenByLabel)
    .split('{{CATEGORY_LABEL}}').join(S.categoryLabel)
    .split('{{ARTICLE_LABEL}}').join(S.articleLabel)
    .split('{{ALL_POSTS_LABEL}}').join(S.allPostsLabel)
    .split('{{SHARE_LABEL}}').join(S.shareLabel)
    .split('{{BOOK_VISIT_LABEL}}').join(S.bookVisitLabel)
    .split('{{NEXT_STEPS_LABEL}}').join(S.nextStepsLabel)
    .split('{{EXPLORE_PROGRAMMES_LABEL}}').join(S.exploreProgrammesLabel)
    .split('{{ADMISSIONS_PROCESS_LABEL}}').join(S.admissionsProcessLabel)
    .split('{{CONTACT_SCHOOL_LABEL}}').join(S.contactSchoolLabel)
    .split('{{CTA_TITLE}}').join(S.ctaTitle)
    .split('{{CTA_TEXT}}').join(S.ctaText)
    .split('{{CTA_BTN}}').join(S.ctaBtn)
    .split('{{REL_PROG_TAG}}').join(S.relProgTag)
    .split('{{REL_PROG_TITLE}}').join(S.relProgTitle)
    .split('{{REL_PROG_TEXT}}').join(S.relProgText)
    .split('{{REL_LIFE_TAG}}').join(S.relLifeTag)
    .split('{{REL_LIFE_TITLE}}').join(S.relLifeTitle)
    .split('{{REL_LIFE_TEXT}}').join(S.relLifeText)
    .split('{{REL_ADM_TAG}}').join(S.relAdmTag)
    .split('{{REL_ADM_TITLE}}').join(S.relAdmTitle)
    .split('{{REL_ADM_TEXT}}').join(S.relAdmText)
    .split('{{FOOTER_PRIVACY}}').join(S.footerPrivacy)
    .split('{{FOOTER_TERMS}}').join(S.footerTerms)
    .split('{{FOOTER_CONTACT}}').join(S.footerContact)
    .split('{{LANG_CURRENT}}').join(locale.toUpperCase())
    .split('{{SEL_EN}}').join(locale==='en'?'true':'false')
    .split('{{SEL_FR}}').join(locale==='fr'?'true':'false')
    .split('{{SEL_ES}}').join(locale==='es'?'true':'false')
    .split('{{SEL_CA}}').join(locale==='ca'?'true':'false');

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,slug+'.html'),html);
}

// 1) English: unchanged behaviour (blog/<slug>.html + index.html cards)
for(const p of enPosts){
  renderPost(p.slug, p.data, p.body, 'en', 1, path.join(ROOT,'blog'));
  console.log('wrote blog/'+p.slug+'.html');
}

const cards=enPosts.map(p=>{const d=p.data;const excerpt=esc(firstPara(p.body));const thumb=d.hero?`<img alt="${esc(d.hero_alt||d.title)}" loading="lazy" src="${imgIndex(d.hero)}"/>`:'';
return `<article class="blog-card reveal" id="${p.slug}">
<div class="blog-thumb">${thumb}</div>
<div class="blog-body">
<div class="blog-cat">${esc(d.category||'News')}</div>
<h3 class="blog-title">${esc(d.title)}</h3>
<div class="blog-date">${fmtDate(d.date,'en')} · Written by ${esc(d.author||'BMS')}</div>
<p class="blog-excerpt">${excerpt}</p>
<a class="btn btn-outline blog-read" href="blog/${p.slug}.html" target="_self">Read full article →</a>
</div>
</article>`;}).join('\n');

const INDEX=path.join(ROOT,'index.html');
let idx=fs.readFileSync(INDEX,'utf8');
const re=/<!-- BLOG:CARDS:START -->[\s\S]*?<!-- BLOG:CARDS:END -->/;
if(re.test(idx)){idx=idx.replace(re,'<!-- BLOG:CARDS:START -->\n'+cards+'\n<!-- BLOG:CARDS:END -->');fs.writeFileSync(INDEX,idx);console.log('index.html: regenerated '+enPosts.length+' cards');}
else console.warn('WARNING: BLOG:CARDS markers not found in index.html — cards not updated');

// 2) Translated locales: content/blog/<locale>/<slug>.md supplies title/description/body only;
//    everything else (date, author, category, hero, gallery) is reused from the English post.
for(const locale of ['fr','es','ca']){
  const dir=path.join(CONTENT,locale);
  if(!fs.existsSync(dir)){console.warn('No content/blog/'+locale+' directory — skipping '+locale);continue;}
  const files=fs.readdirSync(dir).filter(f=>/\.md$/.test(f));
  let count=0;
  for(const f of files){
    const slug=f.replace(/\.md$/,'');
    const en=enBySlug[slug];
    if(!en){console.warn('No English source post for '+locale+'/'+slug+' — skipping (need matching content/blog/'+slug+'.md)');continue;}
    const g=matter(fs.readFileSync(path.join(dir,f),'utf8'));
    const data=Object.assign({}, en.data, {
      title: g.data.title || en.data.title,
      description: g.data.description || en.data.description,
    });
    const body = g.content && g.content.trim() ? g.content : en.body;
    renderPost(slug, data, body, locale, 2, path.join(ROOT,locale,'blog'));
    count++;
  }
  console.log('wrote '+count+' '+locale+'/blog/*.html pages');

  // Update this locale's homepage blog cards too, if it has the same markers.
  const localeIndex=path.join(ROOT,locale,'index.html');
  if(fs.existsSync(localeIndex)){
    let lidx=fs.readFileSync(localeIndex,'utf8');
    if(re.test(lidx)){
      const S=STRINGS[locale];
      const lcards=enPosts.filter(p=>enBySlug[p.slug]).map(p=>{
        const d=p.data;
        const tFile=path.join(dir,p.slug+'.md');
        let title=d.title, excerpt=esc(firstPara(p.body));
        if(fs.existsSync(tFile)){
          const g=matter(fs.readFileSync(tFile,'utf8'));
          title=g.data.title||d.title;
          if(g.content && g.content.trim()) excerpt=esc(firstPara(g.content));
        }
        const thumb=d.hero?`<img alt="${esc(d.hero_alt||title)}" loading="lazy" src="${imgIndex(d.hero)}"/>`:'';
        const catLabel=(CATEGORY_LABELS[locale]&&CATEGORY_LABELS[locale][d.category])||d.category||'News';
        return `<article class="blog-card reveal" id="${p.slug}">
<div class="blog-thumb">${thumb}</div>
<div class="blog-body">
<div class="blog-cat">${esc(catLabel)}</div>
<h3 class="blog-title">${esc(title)}</h3>
<div class="blog-date">${fmtDate(d.date,locale)} · ${S.writtenByMeta} ${esc(d.author||'BMS')}</div>
<p class="blog-excerpt">${excerpt}</p>
<a class="btn btn-outline blog-read" href="blog/${p.slug}.html" target="_self">${S.allPostsLabel}: ${esc(title)} →</a>
</div>
</article>`;
      }).join('\n');
      lidx=lidx.replace(re,'<!-- BLOG:CARDS:START -->\n'+lcards+'\n<!-- BLOG:CARDS:END -->');
      fs.writeFileSync(localeIndex,lidx);
      console.log(locale+'/index.html: regenerated '+enPosts.length+' cards');
    } else {
      console.log(locale+'/index.html has no BLOG:CARDS markers — homepage blog section left untouched (posts are still reachable directly at /'+locale+'/blog/<slug>.html and via the language switcher from the English post).');
    }
  }
}
