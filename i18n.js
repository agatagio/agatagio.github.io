// Idioma do portfólio: PT (padrão) e EN. Traduz textos e atributos pelo dicionário i18n-en.json.
(function(){
  var KEY = 'lang', DICT_URL = 'i18n-en.json?v=2';
  var ATTRS = ['alt', 'aria-label', 'title', 'data-cap', 'data-name', 'placeholder', 'aria-roledescription'];
  var SEL = ATTRS.map(function(a){ return '[' + a + ']'; }).join(',');
  var dict = null, lang = 'pt', busy = false, obs = null;
  var textOrig = new WeakMap(), attrOrig = new WeakMap();
  var desc = document.querySelector('meta[name="description"]'), descPT = desc ? desc.content : '';
  var descEN = 'Portfolio of Ágata Giovanna: UX/UI Designer, web developer and front-end. Case studies: Aprende+, Regulariza BR and CINOVA.';
  var btns = [].slice.call(document.querySelectorAll('.lang-toggle [data-lang]'));

  function norm(s){ return s.replace(/\s+/g, ' ').trim(); }
  function t(s){
    var k = norm(s); if(!k) return null;
    if(dict.hasOwnProperty(k)) return dict[k];
    var m;
    if((m = k.match(/^Ampliar: (.+)$/))) return 'Enlarge: ' + (t(m[1]) || m[1]);
    if((m = k.match(/^Trazer para frente: (.+)$/))) return 'Bring to front: ' + (t(m[1]) || m[1]);
    if((m = k.match(/^Wireframe em tons de cinza da tela (.+)$/))) return 'Gray wireframe of the ' + (t(m[1]) || m[1]) + ' screen';
    if((m = k.match(/^Tela final (.+), com a identidade do MoniTube$/))) return 'Final ' + (t(m[1]) || m[1]) + ' screen, with the MoniTube identity';
    if((m = k.match(/^(.+) · (\d+) \/ (\d+)$/))){ var n = t(m[1]); if(n) return n + ' · ' + m[2] + ' / ' + m[3]; }
    return null;
  }

  function doText(node){
    var v = node.nodeValue, en = t(v);
    if(en === null || en === undefined) return;
    var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
    if(!textOrig.has(node)) textOrig.set(node, v);
    node.nodeValue = lead + en + (v.trim() ? trail : '');
  }
  function doAttrs(el){
    ATTRS.forEach(function(a){
      if(!el.hasAttribute(a)) return;
      var v = el.getAttribute(a), en = t(v);
      if(en === null || en === undefined) return;
      var o = attrOrig.get(el); if(!o){ o = {}; attrOrig.set(el, o); }
      if(!(a in o)) o[a] = v;
      el.setAttribute(a, en);
    });
  }
  function walk(root){
    if(root.nodeType === 3){ if(root.parentNode && !/^(SCRIPT|STYLE)$/.test(root.parentNode.nodeName)) doText(root); return; }
    if(root.nodeType !== 1) return;
    if(/^(SCRIPT|STYLE|SVG)$/i.test(root.nodeName)) return;
    if(root.matches && root.matches(SEL)) doAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function(n){
      var p = n.parentNode; return p && /^(SCRIPT|STYLE)$/i.test(p.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var n, list = []; while((n = w.nextNode())) list.push(n);
    list.forEach(doText);
    root.querySelectorAll(SEL).forEach(doAttrs);
  }
  function restore(){
    // textos e atributos que foram traduzidos voltam ao original
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, list = [];
    while((n = w.nextNode())) list.push(n);
    list.forEach(function(x){ if(textOrig.has(x)){ x.nodeValue = textOrig.get(x); textOrig.delete(x); } });
    document.querySelectorAll(SEL).forEach(function(el){
      var o = attrOrig.get(el); if(!o) return;
      Object.keys(o).forEach(function(a){ el.setAttribute(a, o[a]); });
      attrOrig.delete(el);
    });
  }
  function watch(on){
    if(on && !obs){
      obs = new MutationObserver(function(recs){
        if(busy || lang !== 'en') return;
        busy = true;
        recs.forEach(function(r){
          if(r.type === 'childList') r.addedNodes.forEach(walk);
          else if(r.type === 'characterData') doText(r.target);
          else if(r.type === 'attributes') doAttrs(r.target);
        });
        obs.takeRecords(); busy = false;
      });
      obs.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS });
    }
    if(!on && obs){ obs.disconnect(); obs = null; }
  }
  function ui(){
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    if(desc) desc.content = lang === 'en' ? descEN : descPT;
    btns.forEach(function(b){ var on = b.dataset.lang === lang; b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function apply(l){
    if(l === 'en'){
      lang = 'en'; busy = true; walk(document.body); busy = false; watch(true);
    } else {
      watch(false); busy = true; restore(); busy = false; lang = 'pt';
    }
    ui();
    try { localStorage.setItem(KEY, lang); } catch(e){}
  }
  function set(l){
    if(l === lang && (l === 'pt' || dict)) return;
    if(l === 'en' && !dict){
      fetch(DICT_URL).then(function(r){ return r.json(); }).then(function(d){ dict = d; apply('en'); })
        .catch(function(){ lang = 'pt'; ui(); });
    } else apply(l);
  }
  btns.forEach(function(b){ b.addEventListener('click', function(){ set(b.dataset.lang); }); });

  var q = (location.search.match(/[?&]lang=(pt|en)/) || [])[1], saved = null;
  try { saved = localStorage.getItem(KEY); } catch(e){}
  var start = q || saved || 'pt';
  ui();
  if(start === 'en') set('en');
})();
