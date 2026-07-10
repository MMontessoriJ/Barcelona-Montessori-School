/* BMS blog build: markdown (content/blog/*.md) -> blog/<slug>.html + index.html cards.
   Also generates translated blog pages from content/blog/<locale>/*.md (fr/es/ca),
   which supply translated title/description/body only — all other fields (date,
   author, category, hero, gallery images) are reused from the English source post.
   Run by Netlify via `npm run build`. No framework; just gray-matter + marked. */
const fs=require('fs'), path=require('path');
const matter=require('gray-matter');
const {marked}=require('marked');
const sizeOf=require('image-size');

const ROOT=path.join(__dirname,'..');
const CONTENT=path.join(ROOT,'content','blog');
const TEMPLATE=fs.readFileSync(path.join(__dirname,'post-template.html'),'utf8');
const ARCHIVE_TEMPLATE=fs.readFileSync(path.join(__dirname,'blog-index-template.html'),'utf8');
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
    navEvents:'Events', navTraining:'Training',
    admHow:'How to Apply', admFees:'Fees & Discounts', admVisit:'Book a Campus Visit',
    aboutWhy:'Why Barcelona Montessori', aboutMission:'Our Mission', aboutTeam:'Our Team', aboutAccred:'Accreditations & Partners',
    lifeCampuses:'Campuses', lifeParents:'Parents',
    showLabel:'Show', submenuLabel:'submenu',
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
    readMoreLabel:'Read full article →',
    archiveTitle:'All Blog Posts', archiveDesc:'Stories, updates and reflections from life at Barcelona Montessori School — browse the full archive.',
    morePostsLabel:'More from the blog', aboveLabel:'Above',
  },
  fr:{
    announce:'Admissions ouvertes pour 2026-27 · Visitez nos campus à Sarrià',
    navAbout:'À propos', navProgrammes:'Programmes', navAdmissions:'Admissions', navLife:'Vie à BMS',
    navBlog:'Blog', navContact:'Contact', navInterest:'Plus d\'informations',
    navEvents:'Événements', navTraining:'Formation',
    admHow:'Comment postuler', admFees:'Frais et réductions', admVisit:'Réserver une visite du campus',
    aboutWhy:'Pourquoi Barcelona Montessori', aboutMission:'Notre mission', aboutTeam:'Notre équipe', aboutAccred:'Accréditations et partenaires',
    lifeCampuses:'Campus', lifeParents:'Parents',
    showLabel:'Afficher', submenuLabel:'sous-menu',
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
    readMoreLabel:'Lire l\'article complet →',
    archiveTitle:'Tous les articles du blog', archiveDesc:'Récits, actualités et réflexions sur la vie à Barcelona Montessori School — parcourez les archives complètes.',
    morePostsLabel:'Plus d\'articles du blog', aboveLabel:'Ci-dessus',
  },
  es:{
    announce:'Admisiones abiertas para 2026-27 · Visite nuestros campus en Sarrià',
    navAbout:'Quiénes somos', navProgrammes:'Programas', navAdmissions:'Admisiones', navLife:'Vida en BMS',
    navBlog:'Blog', navContact:'Contacto', navInterest:'Más información',
    navEvents:'Eventos', navTraining:'Formación',
    admHow:'Cómo solicitar plaza', admFees:'Tarifas y descuentos', admVisit:'Reservar una visita al campus',
    aboutWhy:'Por qué Barcelona Montessori', aboutMission:'Nuestra misión', aboutTeam:'Nuestro equipo', aboutAccred:'Acreditaciones y socios',
    lifeCampuses:'Campus', lifeParents:'Padres',
    showLabel:'Mostrar', submenuLabel:'submenú',
    backLink:'← Volver a todos los artículos',
    publishedLabel:'Publicado', writtenByLabel:'Escrito por', categoryLabel:'Categoría',
    articleLabel:'Artículo', allPostsLabel:'Todos los artículos', shareLabel:'Compartir artículo', bookVisitLabel:'Reservar una visita',
    nextStepsLabel:'Próximos pasos', exploreProgrammesLabel:'Explorar programas',
    admissionsProcessLabel:'Proceso de admisión', contactSchoolLabel:'Contactar con la escuela',
    ctaTitle:'¿Interesado en Barcelona Montessori School?',
    ctaText:'Cuéntenos qué busca y nuestro equipo le guiará en los próximos pasos.',
    ctaBtn:'Rellenar el formulario de interés',
    relProgTag:'Programa', relProgTitle:'Explora nuestros itinerarios Montessori',
    relProgText:'Desde Nido hasta el Programa de Adolescentes, descubre cómo cada entorno apoya la independencia y el crecimiento.',
    relLifeTag:'Vida en BMS', relLifeTitle:'Aprender más allá del aula',
    relLifeText:'El trabajo al aire libre, la vida en comunidad y la responsabilidad forman parte del ritmo de la vida escolar.',
    relAdmTag:'Admisiones', relAdmTitle:'Reservar una visita',
    relAdmText:'Cuéntenos qué busca y le guiaremos en los próximos pasos.',
    footerPrivacy:'Privacidad', footerTerms:'Términos', footerContact:'Contacto',
    writtenByMeta:'Escrito por',
    readMoreLabel:'Leer el artículo completo →',
    archiveTitle:'Todos los artículos del blog', archiveDesc:'Historias, novedades y reflexiones sobre la vida en Barcelona Montessori School — explora el archivo completo.',
    morePostsLabel:'Más artículos del blog', aboveLabel:'Arriba',
  },
  ca:{
    announce:'Admissions obertes per al 2026-27 · Visiteu els nostres campus a Sarrià',
    navAbout:'Sobre nosaltres', navProgrammes:'Programes', navAdmissions:'Admissions', navLife:'Vida a BMS',
    navBlog:'Blog', navContact:'Contacte', navInterest:'Més informació',
    navEvents:'Esdeveniments', navTraining:'Formació',
    admHow:'Com sol·licitar plaça', admFees:'Tarifes i descomptes', admVisit:'Reservar una visita al campus',
    aboutWhy:'Per què Barcelona Montessori', aboutMission:'La nostra missió', aboutTeam:'El nostre equip', aboutAccred:'Acreditacions i socis',
    lifeCampuses:'Campus', lifeParents:'Pares',
    showLabel:'Mostrar', submenuLabel:'submenú',
    backLink:'← Tornar a tots els articles',
    publishedLabel:'Publicat', writtenByLabel:'Escrit per', categoryLabel:'Categoria',
    articleLabel:'Article', allPostsLabel:'Tots els articles', shareLabel:'Compartir l\'article', bookVisitLabel:'Reservar una visita',
    nextStepsLabel:'Propers passos', exploreProgrammesLabel:'Explorar els programes',
    admissionsProcessLabel:'Procés d\'admissió', contactSchoolLabel:'Contactar amb l\'escola',
    ctaTitle:'Interessat en Barcelona Montessori School?',
    ctaText:'Digui\'ns què busca i el nostre equip el guiarà en els propers passos.',
    ctaBtn:'Emplenar el formulari d\'interès',
    relProgTag:'Programa', relProgTitle:'Descobreix els nostres itineraris Montessori',
    relProgText:'De Nido al Programa d\'Adolescents, descobreix com cada entorn dona suport a la independència i el creixement.',
    relLifeTag:'Vida a BMS', relLifeTitle:'Aprendre més enllà de l\'aula',
    relLifeText:'El treball a l\'aire lliure, la vida comunitària i la responsabilitat formen part del ritme de la vida escolar.',
    relAdmTag:'Admissions', relAdmTitle:'Reservar una visita',
    relAdmText:'Digui\'ns què busca i el guiarem en els propers passos.',
    footerPrivacy:'Privacitat', footerTerms:'Termes', footerContact:'Contacte',
    writtenByMeta:'Escrit per',
    readMoreLabel:'Llegir l\'article complet →',
    archiveTitle:'Tots els articles del blog', archiveDesc:'Històries, novetats i reflexions sobre la vida a Barcelona Montessori School — explora l\'arxiu complet.',
    morePostsLabel:'Més articles del blog', aboveLabel:'A dalt',
  },
};

const fmtDate=(iso,locale)=>{const d=new Date(iso+'T00:00:00');if(isNaN(d))return iso;const m=MONTHS[locale]||MONTHS.en;return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const jsonEsc=s=>JSON.stringify(String(s==null?'':s));
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

// Reads the actual pixel dimensions of a photo straight from the /images folder,
// so vertical (portrait) photos can be shown at their own true aspect ratio instead
// of being force-cropped into a landscape-shaped box (which was cutting faces off
// tall/portrait photos). Returns null if the file is missing or unreadable — callers
// just fall back to the normal cropped box in that case, so a bad/missing image can
// never break the build.
function imgDims(relPath){
  if(!relPath) return null;
  try{ return sizeOf(path.join(ROOT, String(relPath).replace(/^\//,''))); }
  catch(e){ return null; }
}
// Only portrait (taller-than-wide) photos get an aspect-ratio override — landscape
// and square photos keep the normal, uniform cropped box (unchanged behaviour).
function portraitStyle(dims){
  if(!dims || !dims.width || !dims.height || dims.height<=dims.width) return '';
  return ` style="height:auto;aspect-ratio:${dims.width}/${dims.height}"`;
}

// Shared blog-card renderer used for both the homepage's capped list and the full
// archive page. Looks up the translated title/excerpt for non-English locales,
// falling back to the English source if no translation file exists.
function cardHTML(post, locale, opts){
  const d=post.data;
  const S=STRINGS[locale]||STRINGS.en;
  let title=d.title, excerpt=esc(firstPara(post.body));
  if(locale!=='en'){
    const tFile=path.join(CONTENT,locale,post.slug+'.md');
    if(fs.existsSync(tFile)){
      const g=matter(fs.readFileSync(tFile,'utf8'));
      title=g.data.title||d.title;
      if(g.content && g.content.trim()) excerpt=esc(firstPara(g.content));
    }
  }
  const catLabel=(CATEGORY_LABELS[locale]&&CATEGORY_LABELS[locale][d.category])||d.category||'News';
  const thumb=d.hero?`<img alt="${esc(d.hero_alt||title)}" loading="lazy" src="${imgPost(d.hero,opts.depth)}"/>`:'';
  return `<article class="blog-card reveal" id="${post.slug}">
<div class="blog-thumb"${portraitStyle(imgDims(d.hero))}>${thumb}</div>
<div class="blog-body">
<div class="blog-cat">${esc(catLabel)}</div>
<h3 class="blog-title">${esc(title)}</h3>
<div class="blog-date">${fmtDate(d.date,locale)} · ${S.writtenByMeta} ${esc(d.author||'BMS')}</div>
<p class="blog-excerpt">${excerpt}</p>
<a class="btn btn-outline blog-read" href="${opts.hrefPrefix}${post.slug}.html" target="_self">${S.readMoreLabel}</a>
</div>
</article>`;
}

// Look up the translated title/excerpt for a post in a given locale, falling back
// to the English source. Shared by the two archive-only renderers below.
function localizedCard(post, locale){
  const d=post.data;
  let title=d.title, excerpt=esc(firstPara(post.body));
  if(locale!=='en'){
    const tFile=path.join(CONTENT,locale,post.slug+'.md');
    if(fs.existsSync(tFile)){
      const g=matter(fs.readFileSync(tFile,'utf8'));
      title=g.data.title||d.title;
      if(g.content && g.content.trim()) excerpt=esc(firstPara(g.content));
    }
  }
  return {title, excerpt};
}

// ─── It's Nice That–style archive renderers ───
// These are deliberately SEPARATE from cardHTML()/.blog-card above, which continues
// to feed the homepage's own embedded blog section unchanged. archiveFeaturedHTML()
// renders the top few posts as alternating image/text "featured" blocks; archiveGridHTML()
// renders the rest as a flat, borderless, image-led grid. Both are only used inside
// renderArchiveIndex() below.
function archiveFeaturedHTML(post, locale, opts){
  const d=post.data;
  const S=STRINGS[locale]||STRINGS.en;
  const {title, excerpt}=localizedCard(post, locale);
  const catLabel=(CATEGORY_LABELS[locale]&&CATEGORY_LABELS[locale][d.category])||d.category||'News';
  const img=d.hero?`<img alt="${esc(d.hero_alt||title)}" loading="lazy" src="${imgPost(d.hero,opts.depth)}"/>`:'';
  const flip = opts.index % 2 === 1 ? ' flip' : '';
  return `<a class="feat-block${flip} reveal" href="${opts.hrefPrefix}${post.slug}.html">
<div class="feat-media"${portraitStyle(imgDims(d.hero))}>${img}</div>
<div class="feat-copy">
<div class="pill">${esc(catLabel)}</div>
<h2 class="feat-title">${esc(title)}</h2>
<p class="feat-excerpt">${excerpt}</p>
<div class="feat-meta">${fmtDate(d.date,locale)} · ${S.writtenByMeta} ${esc(d.author||'BMS')}</div>
</div>
</a>`;
}

function archiveGridHTML(post, locale, opts){
  const d=post.data;
  const {title}=localizedCard(post, locale);
  const catLabel=(CATEGORY_LABELS[locale]&&CATEGORY_LABELS[locale][d.category])||d.category||'News';
  const thumb=d.hero?`<img alt="${esc(d.hero_alt||title)}" loading="lazy" src="${imgPost(d.hero,opts.depth)}"/>`:'';
  return `<a class="grid-card reveal" href="${opts.hrefPrefix}${post.slug}.html">
<div class="grid-thumb"${portraitStyle(imgDims(d.hero))}>${thumb}</div>
<div class="pill">${esc(catLabel)}</div>
<h3 class="grid-title">${esc(title)}</h3>
<div class="grid-date">${fmtDate(d.date,locale)}</div>
</a>`;
}

function renderPost(slug, data, body, locale, depth, outDir){
  const S=STRINGS[locale]||STRINGS.en;
  const catKey=data.category||'News';
  const catLabel=(CATEGORY_LABELS[locale]&&CATEGORY_LABELS[locale][catKey])||catKey;
  const root='../'.repeat(depth);
  const localePath = locale==='en' ? '' : (locale+'/');
  // Design 3 (full-bleed editorial): the hero image is now the edge-to-edge masthead
  // behind the title, so it's a bare <img> (no figure/caption — that text was removed
  // per feedback). Gallery photos render as individual full-bleed "bleed-img" figures
  // that break out to full viewport width between sections of body text.
  //
  // hero_position (set per-post in the CMS) controls which part of the photo stays
  // visible when it's cropped into the wide, short banner — important for portrait/
  // headshot photos where a face near the top would otherwise get cropped out.
  const HERO_POSITIONS={Top:'center 15%', Center:'center 50%', Bottom:'center 85%'};
  const heroPos=HERO_POSITIONS[data.hero_position]||HERO_POSITIONS.Center;
  const hero=data.hero?`<img alt="${esc(data.hero_alt||data.title)}" loading="lazy" src="${imgPost(data.hero,depth)}" style="object-position:${heroPos}"/>`:'';
  // Portrait hero photos show at their own true aspect ratio (masthead box grows
  // to fit) instead of being cropped into the usual landscape-shaped frame.
  const mastheadStyle=portraitStyle(imgDims(data.hero));
  // Gallery photos are contained, inline images (not full-bleed) with an
  // It's Nice That–style "Above / caption" credit line under each one.
  const gallery=(Array.isArray(data.gallery)&&data.gallery.length)?data.gallery.map(g=>`<figure class="gallery-figure"><img alt="${esc(g.alt||'')}" loading="lazy" src="${imgPost(g.image,depth)}"/>`+(g.caption?`<figcaption><span class="above-label">${S.aboveLabel}</span>${esc(g.caption)}</figcaption>`:'')+`</figure>`).join(''):'';
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
    .split('{{DEK}}').join(esc(data.description||''))
    .split('{{MASTHEAD_STYLE}}').join(mastheadStyle)
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
    .split('{{NAV_EVENTS}}').join(S.navEvents)
    .split('{{NAV_TRAINING}}').join(S.navTraining)
    .split('{{ADM_HOW}}').join(S.admHow)
    .split('{{ADM_FEES}}').join(S.admFees)
    .split('{{ADM_VISIT}}').join(S.admVisit)
    .split('{{ABOUT_WHY}}').join(S.aboutWhy)
    .split('{{ABOUT_MISSION}}').join(S.aboutMission)
    .split('{{ABOUT_TEAM}}').join(S.aboutTeam)
    .split('{{ABOUT_ACCRED}}').join(S.aboutAccred)
    .split('{{LIFE_CAMPUSES}}').join(S.lifeCampuses)
    .split('{{LIFE_PARENTS}}').join(S.lifeParents)
    .split('{{ARIA_ADMISSIONS}}').join(`${S.showLabel} ${S.navAdmissions} ${S.submenuLabel}`)
    .split('{{ARIA_ABOUT}}').join(`${S.showLabel} ${S.navAbout} ${S.submenuLabel}`)
    .split('{{ARIA_LIFE}}').join(`${S.showLabel} ${S.navLife} ${S.submenuLabel}`)
    .split('{{TITLE_JSON}}').join(jsonEsc(data.title))
    .split('{{DESCRIPTION_JSON}}').join(jsonEsc(data.description||data.title))
    .split('{{AUTHOR_JSON}}').join(jsonEsc(data.author||'Barcelona Montessori School'))
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

// Homepage only ever shows the most recent HOMEPAGE_CARD_LIMIT posts; the full archive
// lives at /blog/ (linked via the "All blog posts" / browse-all link on the homepage).
const HOMEPAGE_CARD_LIMIT=6;
const homeEnPosts=enPosts.slice(0,HOMEPAGE_CARD_LIMIT);

const cards=homeEnPosts.map(p=>cardHTML(p,'en',{hrefPrefix:'blog/',depth:0})).join('\n');

const INDEX=path.join(ROOT,'index.html');
let idx=fs.readFileSync(INDEX,'utf8');
const re=/<!-- BLOG:CARDS:START -->[\s\S]*?<!-- BLOG:CARDS:END -->/;
if(re.test(idx)){idx=idx.replace(re,'<!-- BLOG:CARDS:START -->\n'+cards+'\n<!-- BLOG:CARDS:END -->');console.log('index.html: regenerated '+homeEnPosts.length+' cards (of '+enPosts.length+' total posts)');}
else console.warn('WARNING: BLOG:CARDS markers not found in index.html — cards not updated');
// Fix the "Browse all posts ↑" button so it links to the real archive page
// (previously href="#blog", which just scrolled back up to this same capped list).
const browseAllRe=/(<a class="btn btn-outline" href=")#blog(">)/;
if(browseAllRe.test(idx)){idx=idx.replace(browseAllRe,'$1blog/index.html$2');console.log('index.html: "Browse all posts" now links to blog/index.html');}
else console.warn('WARNING: "Browse all posts" button (class="btn btn-outline" href="#blog") not found in index.html — link not updated');
fs.writeFileSync(INDEX,idx);

// 2) Translated locales: content/blog/<locale>/<slug>.md supplies title/description/body only;
//    everything else (date, author, category, hero, gallery) is reused from the English post.
//    translatedSlugs tracks which locale/slug pages actually got built, so the sitemap below
//    only links pages that exist.
const translatedSlugs={fr:new Set(),es:new Set(),ca:new Set()};
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
    translatedSlugs[locale].add(slug);
    count++;
  }
  console.log('wrote '+count+' '+locale+'/blog/*.html pages');

  // Update this locale's homepage blog cards too, if it has the same markers.
  const localeIndex=path.join(ROOT,locale,'index.html');
  if(fs.existsSync(localeIndex)){
    let lidx=fs.readFileSync(localeIndex,'utf8');
    let touched=false;
    if(re.test(lidx)){
      const lcards=homeEnPosts.filter(p=>enBySlug[p.slug]).map(p=>cardHTML(p,locale,{hrefPrefix:'blog/',depth:0})).join('\n');
      lidx=lidx.replace(re,'<!-- BLOG:CARDS:START -->\n'+lcards+'\n<!-- BLOG:CARDS:END -->');
      touched=true;
      console.log(locale+'/index.html: regenerated '+homeEnPosts.length+' cards');
    } else {
      console.log(locale+'/index.html has no BLOG:CARDS markers — homepage blog section left untouched (posts are still reachable directly at /'+locale+'/blog/<slug>.html and via the language switcher from the English post).');
    }
    if(browseAllRe.test(lidx)){lidx=lidx.replace(browseAllRe,'$1blog/index.html$2');touched=true;console.log(locale+'/index.html: "Browse all posts" now links to blog/index.html');}
    else console.warn('WARNING: "Browse all posts" button not found in '+locale+'/index.html — link not updated');
    if(touched) fs.writeFileSync(localeIndex,lidx);
  }
}

// 2b) Full blog archive page (blog/index.html + fr/es/ca variants), listing every post —
// this is what the homepage's "Browse all posts" button now links to, instead of just
// scrolling back up to the capped 6-post section.
function renderArchiveIndex(locale, depth, outDir){
  const S=STRINGS[locale]||STRINGS.en;
  const root='../'.repeat(depth);
  const localePath = locale==='en' ? '' : (locale+'/');
  // Top few posts render as alternating image/text "featured" blocks (It's Nice
  // That style); everything else renders as a flat, borderless, image-led grid.
  const FEATURED_COUNT=3;
  const featuredPosts=enPosts.slice(0,FEATURED_COUNT);
  const gridPosts=enPosts.slice(FEATURED_COUNT);
  const featuredHtml=featuredPosts.map((p,i)=>archiveFeaturedHTML(p, locale, {hrefPrefix:'', depth, index:i})).join('\n');
  const gridHtml=gridPosts.map(p=>archiveGridHTML(p, locale, {hrefPrefix:'', depth})).join('\n');
  const archivePaths={
    en:`${SITE_URL}/blog/index.html`,
    fr:`${SITE_URL}/fr/blog/index.html`,
    es:`${SITE_URL}/es/blog/index.html`,
    ca:`${SITE_URL}/ca/blog/index.html`,
  };
  const hreflangTags=['en','fr','es','ca'].map(loc=>`  <link rel="alternate" hreflang="${loc}" href="${archivePaths[loc]}" />`).join('\n')
    +`\n  <link rel="alternate" hreflang="x-default" href="${archivePaths.en}" />`;

  const html=ARCHIVE_TEMPLATE
    .split('{{HTML_LANG}}').join(locale)
    .split('{{LOCALE_PATH}}').join(localePath)
    .split('{{ROOT}}').join(root)
    .split('{{CANONICAL_URL}}').join(archivePaths[locale])
    .split('{{HREFLANG_TAGS}}').join(hreflangTags)
    .split('{{ARCHIVE_TITLE}}').join(esc(S.archiveTitle))
    .split('{{ARCHIVE_DESC}}').join(esc(S.archiveDesc))
    .split('{{FEATURED}}').join(featuredHtml)
    .split('{{GRID_CARDS}}').join(gridHtml)
    .split('{{MORE_POSTS_LABEL}}').join(esc(S.morePostsLabel))
    .split('{{ANNOUNCE}}').join(S.announce)
    .split('{{BACK_LINK}}').join(S.backLink)
    .split('{{NAV_ABOUT}}').join(S.navAbout)
    .split('{{NAV_PROGRAMMES}}').join(S.navProgrammes)
    .split('{{NAV_ADMISSIONS}}').join(S.navAdmissions)
    .split('{{NAV_LIFE}}').join(S.navLife)
    .split('{{NAV_BLOG}}').join(S.navBlog)
    .split('{{NAV_CONTACT}}').join(S.navContact)
    .split('{{NAV_INTEREST}}').join(S.navInterest)
    .split('{{NAV_EVENTS}}').join(S.navEvents)
    .split('{{NAV_TRAINING}}').join(S.navTraining)
    .split('{{ADM_HOW}}').join(S.admHow)
    .split('{{ADM_FEES}}').join(S.admFees)
    .split('{{ADM_VISIT}}').join(S.admVisit)
    .split('{{ABOUT_WHY}}').join(S.aboutWhy)
    .split('{{ABOUT_MISSION}}').join(S.aboutMission)
    .split('{{ABOUT_TEAM}}').join(S.aboutTeam)
    .split('{{ABOUT_ACCRED}}').join(S.aboutAccred)
    .split('{{LIFE_CAMPUSES}}').join(S.lifeCampuses)
    .split('{{LIFE_PARENTS}}').join(S.lifeParents)
    .split('{{ARIA_ADMISSIONS}}').join(`${S.showLabel} ${S.navAdmissions} ${S.submenuLabel}`)
    .split('{{ARIA_ABOUT}}').join(`${S.showLabel} ${S.navAbout} ${S.submenuLabel}`)
    .split('{{ARIA_LIFE}}').join(`${S.showLabel} ${S.navLife} ${S.submenuLabel}`)
    .split('{{FOOTER_PRIVACY}}').join(S.footerPrivacy)
    .split('{{FOOTER_TERMS}}').join(S.footerTerms)
    .split('{{FOOTER_CONTACT}}').join(S.footerContact)
    .split('{{LANG_CURRENT}}').join(locale.toUpperCase())
    .split('{{SEL_EN}}').join(locale==='en'?'true':'false')
    .split('{{SEL_FR}}').join(locale==='fr'?'true':'false')
    .split('{{SEL_ES}}').join(locale==='es'?'true':'false')
    .split('{{SEL_CA}}').join(locale==='ca'?'true':'false');

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'index.html'), html);
  console.log('wrote '+(locale==='en'?'blog':locale+'/blog')+'/index.html (archive, '+enPosts.length+' posts)');
}

renderArchiveIndex('en', 1, path.join(ROOT,'blog'));
for(const locale of ['fr','es','ca']){
  renderArchiveIndex(locale, 2, path.join(ROOT,locale,'blog'));
}

// 3) Regenerate sitemap.xml from scratch so every blog post — in every language it actually
//    exists in — is listed, with proper hreflang alternates. This replaces the old static
//    sitemap.xml, which only ever listed the original 6 English-only posts.
function altLinks(paths){
  // paths: {en,fr,es,ca} each either a full URL or undefined if that locale doesn't exist.
  const out=[];
  for(const loc of ['en','fr','es','ca']){
    if(paths[loc]) out.push(`    <xhtml:link href="${paths[loc]}" hreflang="${loc}" rel="alternate"/>`);
  }
  if(paths.en) out.push(`    <xhtml:link href="${paths.en}" hreflang="x-default" rel="alternate"/>`);
  return out.join('\n');
}

const today=new Date().toISOString().slice(0,10);
const urls=[];

// Homepages (all 4 locales, cross-linked)
const homePaths={en:`${SITE_URL}/`,fr:`${SITE_URL}/fr/`,es:`${SITE_URL}/es/`,ca:`${SITE_URL}/ca/`};
for(const loc of ['en','fr','es','ca']){
  urls.push(`  <url>\n    <loc>${homePaths[loc]}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n${altLinks(homePaths)}\n  </url>`);
}

// Static English-only pages
const STATIC_PAGES=['interest-form.html','programmes.html','fees.html','campuses.html','summer-camp.html','enrichment-activities.html','team.html','parents.html','privacy-policy.html','terms-of-use.html'];
for(const page of STATIC_PAGES){
  urls.push(`  <url>\n    <loc>${SITE_URL}/${page}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
}

// Blog archive pages (all 4 locales, cross-linked) — lists every post
const archivePaths={en:`${SITE_URL}/blog/index.html`,fr:`${SITE_URL}/fr/blog/index.html`,es:`${SITE_URL}/es/blog/index.html`,ca:`${SITE_URL}/ca/blog/index.html`};
for(const loc of ['en','fr','es','ca']){
  urls.push(`  <url>\n    <loc>${archivePaths[loc]}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n${altLinks(archivePaths)}\n  </url>`);
}

// Blog posts: one <url> per locale that actually exists for that slug, each cross-linking
// to every other locale that exists for the same post.
for(const p of enPosts){
  const paths={en:`${SITE_URL}/blog/${p.slug}.html`};
  if(translatedSlugs.fr.has(p.slug)) paths.fr=`${SITE_URL}/fr/blog/${p.slug}.html`;
  if(translatedSlugs.es.has(p.slug)) paths.es=`${SITE_URL}/es/blog/${p.slug}.html`;
  if(translatedSlugs.ca.has(p.slug)) paths.ca=`${SITE_URL}/ca/blog/${p.slug}.html`;
  const lastmod=/^\d{4}-\d{2}-\d{2}$/.test(String(p.data.date))?p.data.date:today;
  for(const loc of ['en','fr','es','ca']){
    if(!paths[loc]) continue;
    urls.push(`  <url>\n    <loc>${paths[loc]}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n${altLinks(paths)}\n  </url>`);
  }
}

const sitemapXml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), sitemapXml);
console.log('sitemap.xml: regenerated with '+urls.length+' URLs ('+enPosts.length+' posts × locales + homepages + static pages)');
