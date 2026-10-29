(function(){
'use strict';
var LITE=(function(){try{return window.matchMedia('(pointer:coarse), (max-width:820px)').matches||(navigator.hardwareConcurrency||8)<=4||!!(navigator.connection&&navigator.connection.saveData)}catch(e){return false}})();
document.documentElement.classList.toggle('lite',LITE);
var CFG={cover:'folha',banner:true,reps:true,coverToday:true,login:true,flow:true,bg:'brilho'};
try{var _c=JSON.parse(localStorage.getItem('cse-cfg'));if(_c)CFG=Object.assign(CFG,_c)}catch(e){}

var $=function(s,r){return (r||document).querySelector(s)};
function fmt(m){m=Math.round(m);m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function toMin(s){var p=s.split(':');return (+p[0])*60+(+p[1])}
function br(n){return n.toFixed(1).replace('.',',')}
function range(a,b,s){var o=[];for(var t=a;t<=b;t+=s)o.push(t);return o}

/* ---------- paradas (coordenadas do mapa esquemático) ---------- */
var STOPS={
  est:{name:'Estação de Integração UFRJ (BRT)',short:'Estação BRT',p:[295,320]},
  hu:{name:'Hospital Universitário / CCS bloco A',short:'HU / CCS',p:[322,318]},
  ccsbb:{name:'CCS (Banco do Brasil)',p:[362,320]},
  pu:{name:'Prefeitura Universitária',p:[430,420]},
  cepel:{name:'Cepel',p:[583,422]},
  cepe:{name:'CEPE (Clube dos Empregados da Petrobras)',short:'CEPE',p:[725,422]},
  cenpes2:{name:'Cenpes II',p:[650,422]},
  cenpes1:{name:'Cenpes I',p:[690,422]},
  ifn:{name:'Instituto de Física (novo)',p:[750,422]},
  ccmn:{name:'CCMN / CT',short:'CCMN',p:[803,466]},
  ctl:{name:'CT / Faculdade de Letras',short:'CT · Letras',p:[932,421]},
  xisto:{name:'Xistoquímica',p:[985,515]},
  reit:{name:'Reitoria (Prédio Jorge Machado Moreira)',short:'Reitoria',p:[987,365]},
  cetem:{name:'CETEM',p:[1050,290]},
  cpst:{name:'CPST / DFO',p:[1003,327]},
  incub:{name:'Incubadora',p:[1128,327]},
  graf:{name:'Gráfica',p:[1165,327]},
  coppead:{name:'COPPEAD',p:[1050,255]},
  parque:{name:'Parque Tecnológico',p:[1165,295]},
  eefd:{name:'EEFD',p:[407,300]},
  dipro:{name:'DIPRO',p:[407,240]},
  res:{name:'Residência Estudantil',short:'Residência',p:[395,142]},
  biorio:{name:'Antiga Bio-Rio',p:[407,192]}
};
var WP={ath:[803,421],j1:[409,321],j2:[407,410],j3:[420,422],dg:[490,422],dg2:[420,352],wn:[407,142],pc:[985,422],pe:[987,326],wL:[1050,327],wI1:[1112,327],wI2:[1112,295],fr1:[840,438],fr2:[868,438],fr3:[884,422]};
/* rotatórias: Pç. Giulio Massarani (oval) e Av. Pedro Calmon; circulação no sentido anti-horário */
var ROUND={gm:{c:[803,421],rx:32,ry:11},pc:{c:[985,421],rx:12,ry:12}};
function arcPts(tok){var a=tok.slice(1).split(':'),Q=ROUND[a[0]],a0=+a[1],a1=+a[2],o=[];for(var t=a0;t>=a1-0.01;t-=15){var r=t*Math.PI/180;o.push([+(Q.c[0]+Q.rx*Math.cos(r)).toFixed(1),+(Q.c[1]+Q.ry*Math.sin(r)).toFixed(1)])}return o}
function P(id){id=id.replace('~','');return STOPS[id]?STOPS[id].p:WP[id]}
function isStop(id){return !!STOPS[id]}

/* ---------- linhas internas (Prefeitura Universitária) ---------- */
var LINES={
  '1':{name:'Estação × Gráfica',color:'--l1',
    sum:'A cada 10 min das 5h às 19h; a cada 30 min das 19h à meia-noite.',
    trips:[{deps:range(300,1140,10).concat(range(1170,1410,30)),halves:[
      {to:'Gráfica',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ath','ccmn','ath','ctl','pc','xisto','pc','reit','pe','cpst','incub','graf']},
      {to:'Estação',seq:['graf','wL','coppead','cetem','wL','pe','reit','pc','ctl','ath','ccmn','ath','cenpes2','dg','dg2','j1','eefd','dipro','wn','res','wn','biorio','j1','ccsbb','hu','est']}]}]},
  '2':{name:'Estação × COPPEAD',color:'--l2',
    sum:'A cada 40 min. Saídas da Estação das 7h05 às 19h05; da COPPEAD das 7h25 às 18h45. A volta informada vai até a Faculdade de Letras.',
    trips:[
      {deps:range(425,1145,40),halves:[{to:'COPPEAD',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ctl','pc','reit','pe','wL','cetem','coppead']}]},
      {deps:range(445,1125,40),halves:[{to:'F. de Letras',seq:['coppead','cetem','wL','pe','~reit','pc','ctl']}]}]},
  '3':{name:'Estação × Residência Estudantil',color:'--l3',
    sum:'A cada 10 min, das 5h à meia-noite.',
    trips:[{deps:range(300,1430,10),halves:[
      {to:'Residência',seq:['est','hu','j1','j2','j3','pu','dg','dg2','j1','eefd','dipro','wn','res']},
      {to:'Estação',seq:['res','wn','biorio','j1','ccsbb','hu','est']}]}]},
  '4':{name:'Estação × Parque Tecnológico / COPPEAD',color:'--l4',
    sum:'A cada 15 min de dia e 20 min à noite, até 20h30. Depois disso, use a Linha 1 para chegar à frente do Parque.',
    trips:[{deps:[370,390,410].concat(range(430,1120,15),[1130],range(1150,1230,20)),halves:[
      {to:'Parque Tecnológico',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ath','ccmn','ath','ctl','pc','reit','pe','cpst','incub','wI1','wI2','parque']},
      {to:'Estação',seq:['parque','wI2','wI1','wL','coppead','cetem','wL','pe','reit','pc','ctl','ath','ccmn','ath','cenpes2','dg','dg2','j1','eefd','biorio','j1','ccsbb','hu','est']}]}]},
  '5':{name:'Estação × CT / CCMN (expressa)',color:'--l5',approx:true,
    sum:'Expressa, só nos picos: 7h–9h, 11h–13h e 17h–19h30. O intervalo varia; o protótipo estima 15 min.',
    trips:[{deps:range(420,540,15).concat(range(660,780,15),range(1020,1170,15)),halves:[
      {to:'CT / CCMN',seq:['est','hu','j1','j2','j3','pu','cepel','cenpes1','ath','ccmn']},
      {to:'Estação',seq:['ccmn','ath','cenpes2','dg','dg2','j1','eefd','biorio','j1','ccsbb','hu','est']}]}]},
  '6':{name:'Residência Estudantil × Reitoria',color:'--l6',weekdays:true,
    sum:'De segunda a sexta, a cada 60 min, das 7h às 22h.',
    trips:[{deps:range(420,1320,60),halves:[
      {to:'Reitoria',seq:['res','wn','biorio','j1','ccsbb','j1','j2','j3','pu','cepel','cepe','ifn','ctl','pc','reit']},
      {to:'Residência',seq:['pe','wL','cetem','wL','pe','reit','pc','ctl','cenpes2','dg','dg2','j1','eefd','dipro','wn','res']}]}]}
};
/* tempo: ~75 unidades do mapa por minuto + 30 s por parada (estimativa) */
var SPEED=75,DWELL=0.5;
function geom(){Object.keys(LINES).forEach(function(id){
  LINES[id].trips.forEach(function(tr){
    var pts=[],passes=[],cum=0,nst=0,prev=null;
    tr.halves.forEach(function(h,hi){
      h.seq.forEach(function(sid,k){
        if(hi>0&&k===0&&prev&&sid===tr.halves[hi-1].seq[tr.halves[hi-1].seq.length-1])return;
        (sid.charAt(0)==='@'?arcPts(sid):[P(sid)]).forEach(function(p){
          if(prev){cum+=Math.hypot(p[0]-prev[0],p[1]-prev[1])}
          prev=p;pts.push(p);
        });
        if(isStop(sid)){
          if(passes.length&&passes[passes.length-1].stop===sid){passes[passes.length-1].half=hi;return}
          passes.push({stop:sid,off:cum/SPEED+nst*DWELL,half:hi});nst++;
        }
      });
    });
    tr.pts=pts;tr.passes=passes;
  });
});}
geom();
function linesAt(sid){return Object.keys(LINES).filter(function(id){return LINES[id].trips.some(function(t){return t.passes.some(function(p){return p.stop===sid})})})}
function isWeekend(){var d=new Date().getDay();return d===0||d===6}

/* próximas passagens numa parada, por sentido */
function passesAt(lid,sid,now,count){
  var out=[],l=LINES[lid];
  l.trips.forEach(function(tr){
    tr.passes.forEach(function(ps,i){
      if(ps.stop!==sid)return;
      var last=i===tr.passes.length-1;
      var to=tr.halves[ps.half].to,key=last?'fim':to;
      var g=out.filter(function(o){return o.key===key})[0];
      if(!g){g={key:key,to:to,last:last,times:[],first:Infinity};out.push(g)}
      tr.deps.forEach(function(d){var t=d+ps.off;if(t<g.first)g.first=t;if(t>=now)g.times.push(t)});
    });
  });
  out.forEach(function(g){g.times.sort(function(a,b){return a-b});g.times=g.times.slice(0,count)});
  return out;
}
/* opções diretas de A para B */
function options(from,to,now){
  var best={};
  Object.keys(LINES).forEach(function(lid){
    if(LINES[lid].susp)return;
    if(LINES[lid].weekdays&&isWeekend()&&!state.manual)return;
    LINES[lid].trips.forEach(function(tr){
      for(var i=0;i<tr.passes.length;i++){
        if(tr.passes[i].stop!==from)continue;
        for(var j=i+1;j<tr.passes.length;j++){
          if(tr.passes[j].stop!==to)continue;
          tr.deps.forEach(function(d){
            var dep=d+tr.passes[i].off,arr=d+tr.passes[j].off;
            if(dep<now)return;
            if(!best[lid]||arr<best[lid].arr)best[lid]={lid:lid,dep:dep,arr:arr,to:tr.halves[tr.passes[i].half].to};
          });
          break;
        }
      }
    });
  });
  return Object.keys(best).map(function(k){return best[k]}).sort(function(a,b){return a.arr-b.arr});
}
function served(from,to){
  return Object.keys(LINES).some(function(lid){return LINES[lid].trips.some(function(tr){
    var i=tr.passes.findIndex(function(p){return p.stop===from});
    return i>=0&&tr.passes.slice(i+1).some(function(p){return p.stop===to});
  })});
}

/* ---------- guia de prédios (horários: SiBI/UFRJ e endereços das unidades, PR-4) ---------- */
var PLACES={
  ccmn:{name:'CCMN',full:'Centro de Ciências Matemáticas e da Natureza',addr:'Av. Athos da Silveira Ramos, 274 · Cidade Universitária',
    intro:'Reúne Matemática, Física, Química, Geociências, Computação e o Observatório do Valongo. Parte dos institutos fica no prédio vizinho do CT.',
    groups:[
      {title:'No prédio do CCMN',items:[
        {n:'Biblioteca Central do CCMN',w:'Bloco A',h:[480,1230]},
        {n:'Biblioteca do NCE',w:'Bloco C',h:[540,1020]},
        {n:'Biblioteca de Geografia (PPGG)',w:'Bloco I, sala 14',h:[480,1110]},
        {n:'Secretaria de Geografia (IGEO)',w:'Bloco G, sala 025',h:[600,1020]},
        {n:'Instituto de Computação',w:'Atendimento da secretaria',h:[540,720]},
        {n:'Geologia (IGEO)',w:'Atendimento por e-mail',h:null}]},
      {title:'Institutos do CCMN no prédio do CT (nº 149)',items:[
        {n:'Instituto de Matemática',w:'Bloco C, sala 103',h:[540,1020]},
        {n:'Biblioteca do IM (Leopoldo Nachbin)',w:'Bloco C, sala 120',h:[510,1230]},
        {n:'Instituto de Física',w:'Bloco A, 3º andar, sala 342-A',h:null},
        {n:'Biblioteca do IF (Plínio Sussekind Rocha)',w:'Bloco A, 3º andar, sala 340',h:[510,1230]},
        {n:'Instituto de Química',w:'Bloco A, 6º andar, sala 632',h:[660,900]},
        {n:'Biblioteca do IQ',w:'Bloco A, sala 527',h:[540,1230]}]}
    ],
    tips:['Do CCMN ao CT dá para ir a pé em poucos minutos.','Biblioteca do CT: Bloco B, 2º andar, das 7h às 19h.','Para voltar à Estação BRT, as linhas 1, 4 e 5 passam na parada CCMN / CT.']}
};
function hrs(h){function f(m){var x=Math.floor(m/60),y=m%60;return x+'h'+(y?String(y).padStart(2,'0'):'')}return f(h[0])+' às '+f(h[1])}
function openPill(h,now){
  if(!h)return '<span class="pill warn">Sem horário</span>';
  if(isWeekend()&&!state.manual)return '<span class="pill bad">Fechado</span>';
  if(now>=h[0]&&now<h[1])return now>=h[1]-30?'<span class="pill warn">Fecha em '+(h[1]-now)+' min</span>':'<span class="pill good">Aberto</span>';
  return '<span class="pill bad">Fechado</span>';
}
function placeHTML(id,now){
  var p=PLACES[id];
  return '<section class="place"><div><p class="eyebrow">Guia do prédio · seg. a sex.</p><h2>'+p.name+'</h2><p class="muted">'+p.full+'</p></div>'+
    '<p class="small mono muted">'+p.addr+'</p><p>'+p.intro+'</p>'+
    p.groups.map(function(g){
      return '<h3>'+g.title+'</h3><ul class="hours">'+g.items.map(function(it){
        return '<li><span class="grow"><b>'+it.n+'</b><small>'+it.w+'</small></span><span class="hr"><span class="mono">'+(it.h?hrs(it.h):'—')+'</span>'+openPill(it.h,now)+'</span></li>';
      }).join('')+'</ul>';
    }).join('')+
    '<ul class="tips">'+p.tips.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></section>';
}

/* ---------- Wi-Fi aberto (exemplos) ---------- */
var WIFI={
  est:{name:'Estação de Integração (BRT)',p:[260,350],avg:2.4,votes:12,note:'Oscila nos horários de pico.'},
  ccs:{name:'CCS, área de convivência',p:[360,298],avg:3.6,votes:19,note:'Melhor perto das cantinas.'},
  ru:{name:'Restaurante Universitário',p:[452,352],avg:3.1,votes:27,note:'Costuma cair no horário do almoço.'},
  bib:{name:'Biblioteca do CT',p:[870,470],avg:4.5,votes:34,note:'Sinal bom nas mesas do fundo.'},
  letras:{name:'Faculdade de Letras',p:[945,348],avg:3.8,votes:16,note:'Bom no pátio e nas salas de estudo.'},
  reit:{name:'Reitoria / EBA / FAU',p:[1040,382],avg:3.3,votes:10,note:'Fraco nos andares altos.'},
  parque:{name:'Parque Tecnológico',p:[1295,365],avg:4.1,votes:9,note:'Funciona melhor nos saguões.'}
};
/* ---------- tutorial eduroam (TIC/UFRJ e RNP) ---------- */
var EDU=[
  {t:'Cadastre o e-mail do eduroam na Intranet UFRJ',b:['Entre com seu CPF e a senha da Intranet e informe um e-mail. Confirme pela mensagem que chega nele.','<a href="https://intranet.ufrj.br/atualizar-email-eduroam" target="_blank" rel="noopener">intranet.ufrj.br/atualizar-email-eduroam</a>','A RNP leva até 24 horas para ativar o cadastro. Faça isso antes da primeira semana de aula.']},
  {t:'Apague configurações antigas do eduroam',b:['No celular: Configurações › Wi-Fi › toque e segure “eduroam” › Esquecer rede. Use os dados móveis para o próximo passo.']},
  {t:'Instale o app geteduroam',b:['É o assistente oficial recomendado pela RNP. Ele configura a segurança da rede sozinho.','<a href="https://play.google.com/store/apps/details?id=app.eduroam.geteduroam" target="_blank" rel="noopener">Android (Google Play)</a> · <a href="https://apps.apple.com/no/app/geteduroam/id1504076137" target="_blank" rel="noopener">iPhone (App Store)</a>']},
  {t:'Escolha a UFRJ e entre com seus dados',b:['Na tela inicial, busque “UFRJ” (Universidade Federal do Rio de Janeiro). Usuário: o e-mail cadastrado no passo 1. Senha: a sua senha da Intranet UFRJ.','Toque em “Connect to network” e depois em “Permitir”.']},
  {t:'Pronto: conecta sozinho, aqui e no mundo',b:['O aparelho entra no eduroam automaticamente em qualquer instituição participante, no Brasil e em outros países. Não desinstale o app; ele guarda o perfil da rede.','Se trocar a senha da Intranet, atualize a senha salva no eduroam.']}
];
var DKEY='cse-ufrj-edu-v1',eduDone={};
try{eduDone=JSON.parse(localStorage.getItem(DKEY))||{}}catch(e){eduDone={}}
function eduHTML(){
  var n=EDU.filter(function(s,i){return eduDone[i]}).length;
  return '<button class="back" type="button" data-go="home">← Voltar</button>'+
    '<div><p class="eyebrow">Tutorial · Wi-Fi global das universidades</p><h2>Como entrar no eduroam</h2></div>'+
    '<p>O eduroam é a rede Wi-Fi gratuita da comunidade acadêmica. Com o login da UFRJ, você se conecta no Fundão e em milhares de universidades e centros de pesquisa pelo mundo, sem pedir senha a ninguém.</p>'+
    '<div class="cmp"><div><b>eduroam</b>Gratuita, com login. Conexão criptografada; serve para banco e senhas.</div><div><b>Wi-Fi aberto</b>Gratuito, sem login. Sem criptografia; use só para coisas simples.</div></div>'+
    '<dl class="cred"><dt>Rede</dt><dd class="mono">eduroam</dd><dt>Usuário</dt><dd>E-mail cadastrado no eduroam</dd><dt>Senha</dt><dd>Senha da Intranet UFRJ</dd></dl>'+
    '<div><p class="small muted" id="eduprog">'+n+' de '+EDU.length+' passos feitos</p><div class="progress" aria-hidden="true"><i style="width:'+(n/EDU.length*100)+'%"></i></div></div>'+
    '<ol class="steps">'+EDU.map(function(s,i){
      return '<li class="'+(eduDone[i]?'done':'')+'"><input type="checkbox" id="edu'+i+'" data-edu="'+i+'"'+(eduDone[i]?' checked':'')+' aria-label="Marcar passo '+(i+1)+' como feito"><label class="st-t" for="edu'+i+'">'+(i+1)+'. '+s.t+'</label><div class="st-b">'+s.b.map(function(x){return '<span>'+x+'</span>'}).join('')+'</div></li>';
    }).join('')+'</ol>'+
    '<details class="det"><summary>Sem o app (conexão manual)</summary><p class="small muted">Use só dentro da UFRJ, onde a rede é genuína. Escolha a rede eduroam, digite o e-mail completo e a senha, e toque em “Confiar” no certificado.</p></details>'+
    '<details class="det"><summary>Onde tem eduroam?</summary><p class="small muted">Veja os locais no <a href="https://monitor.eduroam.org/map_service_loc.php" target="_blank" rel="noopener">mapa do eduroam</a> ou no app eduroam Companion. Problemas com a senha: <a href="https://servicos.tic.ufrj.br/" target="_blank" rel="noopener">Central de Serviços da TIC/UFRJ</a>.</p></details>';
}

var KEY='cse-ufrj-ratings-v1',PKEY='cse-ufrj-prefs-v1';
var mine={},prefs={};
try{mine=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){mine={}}
try{prefs=JSON.parse(localStorage.getItem(PKEY))||{}}catch(e){prefs={}}
function saveMine(){try{localStorage.setItem(KEY,JSON.stringify(mine))}catch(e){}}
function savePrefs(){try{localStorage.setItem(PKEY,JSON.stringify({from:state.from,to:state.to}))}catch(e){}}
function avgOf(id){var w=WIFI[id],m=mine[id];return m?(w.avg*w.votes+m)/(w.votes+1):w.avg}
function votesOf(id){return WIFI[id].votes+(mine[id]?1:0)}
function info(avg){var b=avg>=4.3?4:avg>=3.5?3:avg>=2.5?2:1;return {bars:b,label:['','Fraco','Regular','Bom','Muito bom'][b],tone:b>=3?'good':b===2?'warn':'bad'}}
function d2(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])}
function wifiNearStop(sid){return Object.keys(WIFI).filter(function(w){return d2(WIFI[w].p,STOPS[sid].p)<=95}).sort(function(a,b){return avgOf(b)-avgOf(a)})}
function stopsNearWifi(wid){return Object.keys(STOPS).filter(function(s){return d2(WIFI[wid].p,STOPS[s].p)<=95})}

/* ---------- estado ---------- */
var SORTED=Object.keys(STOPS).sort(function(a,b){if(a==='est')return -1;if(b==='est')return 1;return STOPS[a].name.localeCompare(STOPS[b].name,'pt')});
var state={layers:{bus:true,wifi:true},sel:null,
  from:STOPS[prefs.from]?prefs.from:'est',to:STOPS[prefs.to]?prefs.to:'ctl',manual:false,clk:''};
if(state.from===state.to)state.to=state.from==='ctl'?'est':'ctl';
function realNow(){var d=new Date();return d.getHours()*60+d.getMinutes()}
function nowMin(){return (state.manual&&state.clk)?toMin(state.clk):realNow()}

/* ---------- mapa ---------- */
/* rosa dos ventos: neste mapa o norte fica ~50° à esquerda do "para cima" (HU → Reitoria aponta para sudeste) */
var NORTH=-50;
function rose(cx,cy,r,deg){
  var s='<g class="rose" aria-hidden="true" transform="translate('+cx+','+cy+')"><circle class="rose-disc" r="'+(r+14)+'"/><circle class="rose-ring" r="'+(r-14)+'"/>';
  s+='<g transform="rotate('+deg+')">';
  [45,135,225,315].forEach(function(a){s+='<path class="rose-q" transform="rotate('+a+')" d="M0,'+(-r*0.62)+' L7,0 L0,7 L-7,0Z"/>'});
  [90,180,270].forEach(function(a){s+='<path class="rose-p" transform="rotate('+a+')" d="M0,'+(-r)+' L10,0 L0,10 L-10,0Z"/>'});
  s+='<path class="rose-n" d="M0,'+(-r)+' L10,0 L0,10 L-10,0Z"/><circle r="3.5" class="rose-n"/></g>';
  [['N',0],['L',90],['S',180],['O',270]].forEach(function(c){
    var a=(c[1]+deg)*Math.PI/180,d=r+30;
    s+='<text class="rose-lb'+(c[0]==='N'?'':' dim')+'" x="'+(Math.sin(a)*d).toFixed(1)+'" y="'+(-Math.cos(a)*d).toFixed(1)+'">'+c[0]+'</text>';
  });
  return s+'</g>';
}
/* ---------- mapa vetorial (traçado a partir do mapa da Prefeitura Universitária) ---------- */
var MAPIMG='img/mapa-bordas.jpg';
var MAPHD=window.MAPHD_URL='img/mapa-md.jpg',MAPHD_FULL='img/mapa-hd.jpg',MAPMINI='img/mapa-mini.jpg',MAPBLUR='img/mapa-blur.jpg';
/* nomes recriados como texto: [texto, x, y, classe, nível de zoom, rotação] */
var MAPLABELS=[
  ['Baía de Guanabara',720,232,'ml-w',1,0],
  ['Parque do Catalão',560,98,'ml-a',2,0],['Ilha do Bom Jesus',1046,58,'ml-a',2,0],['Vila Residencial',1258,376,'ml-a',2,0],
  ['Av. Horácio Macedo',560,412,'ml-s',2,0],['Av. Horácio Macedo',938,412,'ml-s',2,0],['Av. Pedro Calmon',997,470,'ml-s',2,-90],
  ['Av. Carlos Chagas Filho',418,250,'ml-s',2,-90],['Rua César Pernetta',314,262,'ml-s',2,-90],['Largo Wanda de Oliveira',405,155,'ml-s',2,0],
  ['Rua Paulo Emídio Barbosa',1150,316,'ml-s',2,0],['Rua Pascoal Lemme',1061,282,'ml-s',3,-90],['Rua Moniz de Aragão',900,508,'ml-s',2,0],
  ['Pç. Giulio Massarani',803,399,'ml-s',2,0],['Linha Vermelha',560,556,'ml-s',2,17],['Rua Octávio Cantanhede',500,52,'ml-s',3,-26],
  ['Alojamento',402,120,'ml-b',2,0],['Bio-Rio',372,176,'ml-b',3,0],['Usina Verde',331,236,'ml-b',3,0],['CCS',381,300,'ml-b',2,0],
  ['IPPMG',283,347,'ml-b',3,0],['HU',352,374,'ml-b',2,0],['EEFD',464,282,'ml-b',2,0],['RU',452,364,'ml-b',3,0],
  ['Prefeitura',438,462,'ml-b',2,0],['CEPEL',587,452,'ml-b',2,0],['CENPES',691,470,'ml-b',2,0],['Cenpes II',678,372,'ml-b',3,0],
  ['IF',752,446,'ml-b',3,0],['CCMN',787,488,'ml-b',2,0],['CT',855,470,'ml-b',2,0],['IMA',958,450,'ml-b',3,0],
  ['Letras',962,396,'ml-b',2,0],['Reitoria',1045,392,'ml-b',2,0],['Xistoquímica',1011,552,'ml-b',3,0],['IEN',1028,474,'ml-b',3,0],
  ['CETEM',1024,276,'ml-b',2,0],['COPPEAD',1030,236,'ml-b',2,0],['Parque Tecnológico',1200,262,'ml-b',2,0],
  ['Incubadora',1112,345,'ml-b',3,0],['Gráfica',1165,345,'ml-b',3,0]
];
/* guaritas (posições do mapa da Prefeitura; o nº 33 da legenda é "Guaritas / DISEG") */
var GUARDS={
  g1:{name:'Guarita 1',short:'G1',where:'Acesso pela Linha Vermelha, sentido Ilha do Governador e Baixada.',p:[250,378]},
  g2:{name:'Guarita 2',short:'G2',where:'Acesso pela Av. Brasil.',p:[385,432]},
  g3:{name:'Guarita 3',short:'G3',where:'Acesso pela Linha Amarela e pela Linha Vermelha, sentido Centro.',p:[801,548]}
};
var svg=$('#map'),gLines,gStops,gWifi,gGuard,gLab;
/* rotação desativada (o mapa base tem nomes na horizontal); ROT fica 0 */
var ROT=0;
function U(p){return ROT?[-p[1],p[0]]:p}
function bounds(){return ROT?{x:-(BASE.y+BASE.h),y:BASE.x,w:BASE.h,h:BASE.w}:BASE}
function wantRot(){return 0}
function orient(){
  var r=wantRot();if(r===ROT)return false;
  ROT=r;var w=$('#world');if(w)w.setAttribute('transform','rotate('+ROT+')');var w0=$('#world0');if(w0)w0.setAttribute('transform','rotate('+ROT+')');
  var rb=$('#rosebox');if(rb)rb.innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
  return true;
}
var BASE={x:90,y:20,w:1314,h:580},view={x:90,y:20,w:1314,h:580},fitW=1314,REF=0.83,MS=1,suppressClick=false;
function mbars(n){var s='',hs=[6,10,14,18];for(var i=0;i<4;i++)s+='<rect class="wb'+(i<n?'':' off')+'" x="'+(-11.5+i*6.2)+'" y="'+(9-hs[i])+'" width="4.4" height="'+hs[i]+'" rx="1.2"/>';return s}
function f1(p){return (+p[0].toFixed(1))+','+(+p[1].toFixed(1))}
/* polilinha com cantos arredondados (curvas suaves nas esquinas e rotatórias) */
function roundPath(pts,r){
  var q=[];pts.forEach(function(p){var l=q[q.length-1];if(!l||Math.abs(l[0]-p[0])>0.01||Math.abs(l[1]-p[1])>0.01)q.push(p)});
  if(q.length<2)return '';
  var d='M'+f1(q[0]);
  for(var i=1;i<q.length-1;i++){
    var a=q[i-1],b=q[i],c=q[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),rr=Math.min(r,l1/2,l2/2);
    var p1=[b[0]-(b[0]-a[0])/l1*rr,b[1]-(b[1]-a[1])/l1*rr],p2=[b[0]+(c[0]-b[0])/l2*rr,b[1]+(c[1]-b[1])/l2*rr];
    d+=' L'+f1(p1)+' Q'+f1(b)+' '+f1(p2);
  }
  return d+' L'+f1(q[q.length-1]);
}
function mk(kind,id,p,label,inner){
  return '<g class="mk '+kind+'" data-kind="'+kind+'" data-id="'+id+'" data-x="'+p[0]+'" data-y="'+p[1]+'" tabindex="0" role="button" aria-label="'+label+'" transform="translate('+p[0]+','+p[1]+')">'+inner+'</g>';
}
function buildMap(){
  $('#mapbase').innerHTML='<g id="world0" transform="rotate('+ROT+')"><g id="baseimg"'+(window.__opac?' style="opacity:'+window.__opac+'"':'')+'><image href="'+MAPIMG+'" x="-270" y="-340" width="2034" height="1300" preserveAspectRatio="none" decoding="async"/><image id="imgHD" href="'+(hdLoaded?MAPHD_FULL:MAPHD)+'" x="90" y="20" width="1314" height="580" preserveAspectRatio="none" decoding="async"/></g></g>';
  var s='<rect class="v-hit" x="-3000" y="-3000" width="8000" height="8000"/>';
  s+='<g id="world" transform="rotate('+ROT+')">';
  s+='<g id="gLines">';
  Object.keys(LINES).forEach(function(id){
    LINES[id].trips.forEach(function(tr){
      s+='<path class="ln'+(LINES[id].susp?' susp':'')+'" data-line="'+id+'" style="stroke:var(--m'+id+')" d="'+roundPath(tr.pts,0)+'"/>';
    });
  });
  /* onda que corre no sentido do ônibus: cauda na cor da linha, cabeça clara (os trechos seguem a ordem das paradas) */
  s+='</g><g id="gFlow" aria-hidden="true">';
  Object.keys(LINES).forEach(function(id){
    LINES[id].trips.forEach(function(tr){
      if(LINES[id].susp)return;
      var d=roundPath(tr.pts,0),c='var(--m'+id+')',L=0;
      for(var k=1;k<tr.pts.length;k++)L+=Math.hypot(tr.pts[k][0]-tr.pts[k-1][0],tr.pts[k][1]-tr.pts[k-1][1]);
      var du=Math.max(2.4,Math.min(5,L/320)).toFixed(2);s+='<g class="fl" data-line="'+id+'" data-dur="'+du+'" style="--dur:'+du+'s">'+
        '<path class="fw gl" pathLength="1" d="'+d+'" style="stroke:'+c+'"/><path class="fw dr" pathLength="1" d="'+d+'" style="stroke:'+c+'"/></g>';
    });
  });
  s+='</g><g id="gStops">';
  Object.keys(STOPS).forEach(function(id){
    var st=STOPS[id],ls=linesAt(id),hub=ls.length>2,r=id==='est'?15:(hub?12:9);
    s+=mk('stop'+(hub?' hub':'')+(st.off?' stoff':''),id,st.p,'Parada '+st.name+(st.off?' (desativada)':'')+', linhas '+ls.join(', '),'<circle class="hit" r="'+(r+10)+'"/><circle class="dot" r="'+r+'"/>').replace(/data-kind="stop[^"]*"/,'data-kind="stop"');
  });
  s+='</g><g id="gGuard">';
  Object.keys(GUARDS).forEach(function(id){
    var g=GUARDS[id];
    s+=mk('guard',id,g.p,g.name+', segurança','<circle class="hit" r="22"/><rect x="-11" y="-11" width="22" height="22" rx="4" transform="rotate(45)"/><text y="0.5">'+g.short+'</text>');
  });
  s+='</g><g id="gSvc" class="off">'+SVC.map(svcMarker).join('')+'</g><g id="gWifi">';
  Object.keys(WIFI).forEach(function(id){
    s+=mk('wifi',id,WIFI[id].p,'Wi-Fi aberto: '+WIFI[id].name,'<circle class="hit" r="26"/><rect class="wbox" x="-17" y="-17" width="34" height="34" rx="8"/><g class="wbars">'+mbars(info(avgOf(id)).bars)+'</g>');
  });
  s+='</g><g id="gRep"></g><g id="gLab" pointer-events="none"></g></g>';
  svg.innerHTML=s;
  gLines=$('#gLines');gStops=$('#gStops');gWifi=$('#gWifi');gGuard=$('#gGuard');gLab=$('#gLab');gSvc=$('#gSvc');gRep=$('#gRep');
}

/* ---------- zoom e arrasto ---------- */
function box(){var r=svg.getBoundingClientRect();return {l:r.left,t:r.top,w:Math.max(1,r.width),h:Math.max(1,r.height)}}
function clampView(){
  var b=box(),minW=b.w/7;
  view.w=Math.max(minW,Math.min(fitW,view.w));view.h=view.w*b.h/b.w;
  var cx=view.x+view.w/2,cy=view.y+view.h/2;
  var B=bounds();cx=Math.max(B.x,Math.min(B.x+B.w,cx));cy=Math.max(B.y,Math.min(B.y+B.h,cy));
  view.x=cx-view.w/2;view.y=cy-view.h/2;
}
var raf=0;
var lastMS=-1,lastMk=-1,lblT=0,lastGesture=0,hdLoaded=false,hdLoading=false,mapBase=null;
function loadHD(){
  if(hdLoaded||hdLoading)return;hdLoading=true;
  var im=new Image();im.decoding='async';
  im.onload=function(){(im.decode?im.decode():Promise.resolve()).catch(function(){}).then(function(){hdLoaded=true;var e=$('#imgHD');if(e)e.setAttribute('href',MAPHD_FULL)})};
  im.onerror=function(){hdLoading=false};
  im.src=MAPHD_FULL;
}
function applyView(force){
  clampView();
  var vb=view.x.toFixed(2)+' '+view.y.toFixed(2)+' '+view.w.toFixed(2)+' '+view.h.toFixed(2);
  svg.setAttribute('viewBox',vb);if(!mapBase)mapBase=$('#mapbase');if(mapBase)mapBase.setAttribute('viewBox',vb);
  var bw=box().w,ppu=bw/view.w;MS=REF/ppu*(bw<680?0.8:1);
  svg.classList.toggle('z2',ppu>1.25);svg.classList.toggle('z3',ppu>2.1);
  if(!hdLoaded&&ppu*(window.devicePixelRatio||1)>1.6)loadHD();
  var mks=svg.querySelectorAll('.mk');
  if(force===true||MS!==lastMS||mks.length!==lastMk){
    svg.style.setProperty('--fw',(5/ppu).toFixed(2));
    var sc=' scale('+MS.toFixed(3)+')',rr=ROT?' rotate('+(-ROT)+')':'';
    for(var i=0;i<mks.length;i++){var el=mks[i];el.setAttribute('transform','translate('+el.dataset.x+','+el.dataset.y+')'+rr+sc)}
    lastMS=MS;lastMk=mks.length;
  }
  var z=$('#zoomlvl');if(z)z.textContent=Math.round(fitW/view.w*100)+'%';
  if(gLab){clearTimeout(lblT);if(Date.now()-lastGesture<160)lblT=setTimeout(drawLabels,170);else drawLabels()}
}
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;applyView()})}
function fitView(){
  var b=box(),ar=b.h/b.w,B=bounds();
  if(ar>=B.h/B.w){view.w=B.w;view.h=view.w*ar}else{view.h=B.h;view.w=view.h/ar}
  fitW=view.w;view.x=B.x+B.w/2-view.w/2;view.y=B.y+B.h/2-view.h/2;
}
function toMap(cx,cy){var b=box();return [view.x+(cx-b.l)/b.w*view.w,view.y+(cy-b.t)/b.h*view.h]}
function zoomAt(m,f){var nw=Math.max(box().w/7,Math.min(fitW,view.w/f)),k=nw/view.w;view.x=m[0]-(m[0]-view.x)*k;view.y=m[1]-(m[1]-view.y)*k;view.w=nw;view.h=nw*box().h/box().w;schedule()}
function centerMap(){return [view.x+view.w/2,view.y+view.h/2]}
/* zoom pelos botões: aproxima do item escolhido; sem escolha, do eixo central do campus (o centro da tela inteira cai na baía) */
function focusPoint(){
  var s=state.sel,o=null;
  if(s&&s.kind==='stop')o=STOPS[s.id];else if(s&&s.kind==='wifi')o=WIFI[s.id];else if(s&&s.kind==='guard')o=GUARDS[s.id];
  else if(s&&s.kind==='night')o=STOPS[state.nightFrom];else if(s&&s.kind==='place')o=PL[s.id];else if(s&&s.kind==='svc')o=SVCMAP[s.id];else if(!s)o=STOPS[state.to];
  var c=centerMap();
  if(o){var q=U(o.p);if(q[0]>view.x&&q[0]<view.x+view.w&&q[1]>view.y&&q[1]<view.y+view.h)return q}
  return Math.abs(view.w-fitW)<1?U([720,400]):c;
}
function ensureVisible(p){
  p=U(p);var mx=view.w*0.12,my=view.h*0.12;
  if(p[0]<view.x+mx||p[0]>view.x+view.w-mx||p[1]<view.y+my||p[1]>view.y+view.h-my){view.x=p[0]-view.w/2;view.y=p[1]-view.h/2;schedule()}
}
function initZoom(){
  orient();fitView();
  if(!ROT&&box().w<680){var c=[640,330];view.w=Math.min(fitW,760);view.h=view.w*box().h/box().w;view.x=c[0]-view.w/2;view.y=c[1]-view.h/2}
  applyView();
  var pts={},start=null,moved=0;
  svg.addEventListener('wheel',function(e){e.preventDefault();lastGesture=Date.now();zoomAt(toMap(e.clientX,e.clientY),Math.exp(-e.deltaY*(e.deltaMode===1?0.05:0.0016)))},{passive:false});
  svg.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;
    if(Object.keys(pts).length===1)start={x:e.clientX,y:e.clientY};
  });
  svg.addEventListener('pointermove',function(e){
    var p=pts[e.pointerId];if(!p)return;
    var ids=Object.keys(pts),b=box();lastGesture=Date.now();
    if(ids.length===1){
      var dx=e.clientX-p.x,dy=e.clientY-p.y;
      moved+=Math.abs(dx)+Math.abs(dy);
      if(moved>6){
        if(!svg.classList.contains('dragging')){svg.classList.add('dragging');try{svg.setPointerCapture(e.pointerId)}catch(err){}}
        view.x-=dx*view.w/b.w;view.y-=dy*view.h/b.h;schedule();
      }
      p.x=e.clientX;p.y=e.clientY;
    }else if(ids.length===2){
      var o=pts[ids[0]===String(e.pointerId)?ids[1]:ids[0]];
      var d0=Math.hypot(p.x-o.x,p.y-o.y),d1=Math.hypot(e.clientX-o.x,e.clientY-o.y);
      var m0=[(p.x+o.x)/2,(p.y+o.y)/2],m1=[(e.clientX+o.x)/2,(e.clientY+o.y)/2];
      if(d0>0){zoomAt(toMap(m1[0],m1[1]),d1/d0)}
      view.x-=(m1[0]-m0[0])*view.w/b.w;view.y-=(m1[1]-m0[1])*view.h/b.h;
      moved+=99;p.x=e.clientX;p.y=e.clientY;schedule();
    }
  });
  function up(e){
    if(!pts[e.pointerId])return;
    delete pts[e.pointerId];
    if(moved>6)suppressClick=true;
    if(!Object.keys(pts).length){svg.classList.remove('dragging');lastGesture=0;clearTimeout(lblT);if(gLab)drawLabels();setTimeout(function(){suppressClick=false},0)}
  }
  svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')up(e)});
  svg.addEventListener('dblclick',function(e){e.preventDefault();zoomAt(toMap(e.clientX,e.clientY),1.8)});
  $('#zin').addEventListener('click',function(){var f=focusPoint();zoomAt(f,1.6);view.x+=(f[0]-(view.x+view.w/2))*0.5;view.y+=(f[1]-(view.y+view.h/2))*0.5;schedule()});
  $('#zout').addEventListener('click',function(){zoomAt(centerMap(),1/1.6)});
  $('#zfit').addEventListener('click',function(){fitView();applyView()});
  svg.addEventListener('keydown',function(e){
    if(e.target!==svg)return;
    if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt(centerMap(),1.4)}
    else if(e.key==='-'){e.preventDefault();zoomAt(centerMap(),1/1.4)}
  });
  var lastW=box().w;
  if(window.ResizeObserver)new ResizeObserver(function(){if(orient()){lastW=box().w;fitView();applyView();return}var w=box().w;if(Math.abs(w-lastW)<1&&Math.abs(view.h-view.w*box().h/w)<0.5)return;var keep=fitW/view.w,c=centerMap();lastW=w;fitView();view.w=fitW/keep;view.h=view.w*box().h/box().w;view.x=c[0]-view.w/2;view.y=c[1]-view.h/2;applyView()}).observe(svg);
}

var planBest=null;
function activeLines(){
  if(!state.sel)return planBest?[planBest.lid]:null;
  if(state.sel.kind==='line')return [state.sel.id];
  if(state.sel.kind==='stop')return linesAt(state.sel.id);
  if(state.sel.kind==='night')return linesAt(state.nightFrom);
  return null;
}
/* rótulo sempre de pé, acima do ponto na tela, sem sair pelas bordas */
function label(p,txt,off){
  var half=(txt.length*6.5+8)*MS,u=U(p);if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return '';
  var dx=Math.min(view.x+view.w-half,Math.max(view.x+half,u[0]))-u[0];
  return '<g transform="translate('+p[0]+','+p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="sl halo" x="'+dx.toFixed(1)+'" y="'+(-off*MS).toFixed(1)+'" text-anchor="middle" style="font-size:'+(21*MS).toFixed(2)+'px;stroke-width:'+(6*MS).toFixed(2)+'px">'+txt+'</text></g>';
}
/* nomes dos pontos ao dar zoom (a partir de ~150% no computador); evita sobreposição */
function lblBox(p,txt,off,fs){var u=U(p),w=txt.length*fs*0.56*MS,hh=fs*1.2*MS;return {x:u[0]-w/2,y:u[1]-off*MS-hh*0.8,w:w,h:hh}}
function hits(a,b){return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h}
function pointLabels(skip,taken){
  var ppu=box().w/view.w;if(ppu<(box().w<680?0.8:1.2))return '';
  var fs=14,list=[];
  if(state.layers.bus)Object.keys(STOPS).forEach(function(id){var st=STOPS[id],hub=linesAt(id).length>2;list.push({p:st.p,t:st.short||st.name,full:st.name,r:id==='est'?15:(hub?12:9),pr:hub?1:2})});
  Object.keys(GUARDS).forEach(function(id){var g=GUARDS[id];list.push({p:g.p,t:g.name,full:g.name,r:15,pr:3})});
  if(state.layers.wifi)Object.keys(WIFI).forEach(function(id){var w=WIFI[id];list.push({p:w.p,t:w.name,full:w.name,r:17,pr:4})});
  SVC.forEach(function(sv){if(svcVisible(sv))list.push({p:sv.p,t:sv.name,full:sv.full,r:12,pr:5})});
  list.sort(function(a,b){return a.pr-b.pr});
  var s='',marks=list.map(function(it){var u=U(it.p),r=it.r*MS;return {x:u[0]-r,y:u[1]-r,w:2*r,h:2*r}});
  list.forEach(function(it){
    if(skip[it.full])return;
    var u=U(it.p);
    if(u[0]<view.x||u[0]>view.x+view.w||u[1]<view.y||u[1]>view.y+view.h)return;
    var w=it.t.length*fs*0.56*MS,hh=fs*1.15*MS,gap=(it.r+5)*MS;
    var cands=[{dx:0,dy:gap+hh*0.85,a:'middle',bx:u[0]-w/2,by:u[1]+gap},{dx:0,dy:-gap-hh*0.2,a:'middle',bx:u[0]-w/2,by:u[1]-gap-hh},{dx:gap,dy:hh*0.35,a:'start',bx:u[0]+gap,by:u[1]-hh/2},{dx:-gap,dy:hh*0.35,a:'end',bx:u[0]-gap-w,by:u[1]-hh/2}];
    for(var i=0;i<cands.length;i++){
      var c=cands[i],bb={x:c.bx,y:c.by,w:w,h:hh};
      if(bb.x<view.x||bb.x+bb.w>view.x+view.w)continue;
      if(taken.some(function(t){return hits(t,bb)})||marks.some(function(m){return hits(m,bb)}))continue;
      taken.push(bb);
      s+='<g transform="translate('+it.p[0]+','+it.p[1]+')'+(ROT?' rotate('+(-ROT)+')':'')+'"><text class="pt-lbl halo" x="'+c.dx.toFixed(1)+'" y="'+c.dy.toFixed(1)+'" text-anchor="'+c.a+'" style="font-size:'+(fs*MS).toFixed(2)+'px;stroke-width:'+(4.5*MS).toFixed(2)+'px">'+it.t+'</text></g>';
      break;
    }
  });
  return s;
}
function drawLabels(){
  var s='',sel=state.sel,o=null;
  if(sel&&sel.kind==='stop')o=STOPS[sel.id];
  else if(sel&&sel.kind==='wifi')o=WIFI[sel.id];
  else if(sel&&sel.kind==='guard')o=GUARDS[sel.id];
  else if(sel&&sel.kind==='night')o=STOPS[state.nightFrom];
  else if(sel&&sel.kind==='place')o=PL[sel.id];
  else if(sel&&sel.kind==='svc')o={p:SVCMAP[sel.id].p,name:SVCMAP[sel.id].name};
  var skip={},taken=[];
  if(o){s+=label(o.p,o.name,34);skip[o.name]=1;taken.push(lblBox(o.p,o.name,34,21))}
  else if(!sel&&state.layers.bus)[state.from,state.to].forEach(function(id){var st=STOPS[id],n=st.short||st.name;s+=label(st.p,n,30);skip[st.name]=1;taken.push(lblBox(st.p,n,30,21))});
  s+=pointLabels(skip,taken);
  gLab.innerHTML=s;
}

/* ---------- várias linhas no ponto: uma de cada vez ---------- */
var seq={key:'',lines:null,i:0,cur:null,t:0};
function flowSeq(lines){
  var gF=$('#gFlow');if(!gF)return;
  var key=lines?lines.join(','):'';
  if(key===seq.key)return;
  seq.key=key;seq.lines=lines;seq.i=0;seq.cur=null;
  gF.classList.toggle('seq',!!lines);svg.classList.toggle('seqing',!!lines);
  gF.querySelectorAll('.fl').forEach(function(el){el.style.setProperty('--dur',el.dataset.dur+'s')});
  if(lines)seqShow();
}
function seqShow(){
  var gF=$('#gFlow');if(!gF||!seq.lines)return;
  var id=seq.lines[seq.i%seq.lines.length],mx=0;seq.cur=id;seq.t=Date.now();
  var gs=gF.querySelectorAll('.fl');
  gs.forEach(function(el){if(el.dataset.line===id)mx=Math.max(mx,+el.dataset.dur)});
  gs.forEach(function(el){var on=el.dataset.line===id;if(on)el.style.setProperty('--dur',mx+'s');el.classList.toggle('on',on)});
  svg.dataset.seqline=id;
}
document.addEventListener('animationiteration',function(e){
  if(!seq.lines||!e.target.classList||!e.target.classList.contains('dr'))return;
  var fl=e.target.closest&&e.target.closest('#gFlow .fl');if(!fl||fl.dataset.line!==seq.cur)return;
  if(Date.now()-seq.t<400)return;
  seq.i++;seqShow();
},true);
function updateMap(){
  gLines.classList.toggle('off',!state.layers.bus);
  gStops.classList.toggle('off',!state.layers.bus);
  gWifi.classList.toggle('off',!state.layers.wifi);
  if(gSvc){gSvc.classList.toggle('off',!state.layers.svc);gSvc.querySelectorAll('.mk').forEach(function(el){el.classList.toggle('off',!svcVisible(SVCMAP[el.dataset.id]))})}
  svg.classList.toggle('night-on',!!state.sel&&(state.sel.kind==='night'||state.sel.kind==='guard'));
  var act=activeLines();
  Array.prototype.slice.call(svg.querySelectorAll('.ln')).forEach(function(el){
    var on=!act||act.indexOf(el.dataset.line)>=0;
    el.classList.toggle('dim',!on);
    if(on&&act)gLines.appendChild(el);
  });
  var gF=$('#gFlow');
  svg.classList.toggle('flowing',!!(state.layers.bus&&CFG.flow&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches));
  if(gF){gF.classList.toggle('off',!state.layers.bus||!CFG.flow);gF.classList.toggle('all',!act);
    if(act&&act.length>1)flowSeq(act);
    else{flowSeq(null);gF.querySelectorAll('.fl').forEach(function(el){el.classList.toggle('on',!act||act.indexOf(el.dataset.line)>=0)})}}
  var sel=state.sel;
  svg.querySelectorAll('.mk').forEach(function(el){
    var k=el.dataset.kind,id=el.dataset.id;
    el.classList.toggle('sel',!!sel&&((k===sel.kind&&id===sel.id)||(sel.kind==='night'&&k==='stop'&&id===state.nightFrom)));
    el.classList.toggle('end',!sel&&k==='stop'&&(id===state.from||id===state.to));
  });
  svg.querySelectorAll('.mk.wifi').forEach(function(el){$('.wbars',el).innerHTML=mbars(info(avgOf(el.dataset.id)).bars)});
  drawLabels();
}

/* ---------- volta à noite (telefones: Prefeitura Universitária, dez/2024) ---------- */
var MOON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg>';
var NIGHTITEM='<button class="item tint" type="button" style="--c:var(--l5)" data-kind="night" data-id="x"><span class="ico">'+MOON+'</span><span class="grow">Volta à noite<small>Último ônibus, guaritas e telefone da segurança</small></span></button>';
var CALLS=[
  {n:'DISEG – Cidade Universitária',d:'Divisão de Segurança da UFRJ · 24 horas',num:'(21) 97380-2554',raw:'21973802554'},
  {n:'Centro de Controle Operacional',d:'Prefeitura Universitária · WhatsApp 24 horas',num:'(21) 99871-1621',raw:'21998711621'},
  {n:'Polícia Militar',d:'Em caso de violência',num:'190',raw:'190'}
];
var NTIPS=['Evite chegar ou sair do campus sozinho tarde da noite; combine de ir junto com colegas.','Espere o ônibus em ponto movimentado e iluminado, sem deixar o celular à mostra.','Viu um carro rondando ou algo estranho? Anote placa, cor e modelo e avise a DISEG.','Não fique no prédio além do necessário depois que as aulas acabam.'];
function nightOK(lid){return !(LINES[lid].weekdays&&isWeekend()&&!state.manual)}
/* último ônibus de A até B, por linha */
function lastTo(from,to){
  var best={};
  Object.keys(LINES).forEach(function(lid){
    if(!nightOK(lid)||LINES[lid].susp)return;
    LINES[lid].trips.forEach(function(tr){
      var last=tr.deps[tr.deps.length-1];
      for(var i=0;i<tr.passes.length;i++){
        if(tr.passes[i].stop!==from)continue;
        for(var j=i+1;j<tr.passes.length;j++){
          if(tr.passes[j].stop!==to)continue;
          var dep=last+tr.passes[i].off,arr=last+tr.passes[j].off;
          if(!best[lid]||dep>best[lid].dep)best[lid]={lid:lid,dep:dep,arr:arr};
          break;
        }
      }
    });
  });
  return Object.keys(best).map(function(k){return best[k]}).sort(function(a,b){return b.dep-a.dep});
}
/* último horário de cada linha numa parada, por sentido */
function lastAt(lid,sid){
  var out={};
  LINES[lid].trips.forEach(function(tr){
    var last=tr.deps[tr.deps.length-1];
    tr.passes.forEach(function(ps,i){
      if(ps.stop!==sid||i===tr.passes.length-1)return;
      var to=tr.halves[ps.half].to,t=last+ps.off;
      if(!out[to]||t>out[to])out[to]=t;
    });
  });
  return Object.keys(out).map(function(k){return {to:k,t:out[k]}}).sort(function(a,b){return b.t-a.t});
}
function lastPill(t,now){
  var d=Math.round(t)-now;
  if(d<0)return '<span class="pill bad">Encerrado</span>';
  if(d<=60)return '<span class="pill warn">Faltam '+d+' min</span>';
  return '<span class="pill good">Ainda há tempo</span>';
}
function nightHTML(now){
  var from=state.nightFrom||state.to;state.nightFrom=from;
  var opts=SORTED.map(function(k){return '<option value="'+k+'"'+(k===from?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('');
  var top='';
  if(from==='est'){
    top='<div class="next"><p><b>Você já está na Estação BRT.</b></p><p class="muted small">Daqui saem o BRT e os ônibus para fora da ilha.</p></div>';
  }else{
    var L=lastTo(from,'est');
    if(!L.length)top='<div class="next"><p><b>Nenhuma linha vai direto daqui para a Estação BRT.</b></p><p class="muted small">Veja abaixo os últimos horários de cada linha nesta parada.</p></div>';
    else{
      var b=L[0],d=Math.round(b.dep)-now;
      top='<div class="next lastbig"><p class="eyebrow">Último ônibus daqui para a Estação BRT</p>'+
        '<div class="nx-top">'+badge(b.lid)+'<span>Linha '+b.lid+' · '+LINES[b.lid].name+'</span></div>'+
        '<div class="nx-big"><span class="nx-min">'+tilde(b.lid)+fmt(b.dep)+'</span>'+lastPill(b.dep,now)+'</div>'+
        '<p class="muted small">'+(d>=0?'Faltam '+(d>=60?Math.floor(d/60)+' h '+(d%60)+' min':d+' min')+'. ':'Este horário já passou hoje. ')+'Chega na Estação por volta de '+fmt(b.arr)+'.</p>'+
        (L.length>1?'<div class="later"><span class="lab">Outras</span>'+L.slice(1).map(function(c){return badge(c.lid)+' <span class="mono">'+tilde(c.lid)+fmt(c.dep)+'</span>'}).join(' ')+'</div>':'')+'</div>';
    }
  }
  var rows=linesAt(from).map(function(lid){
    if(!nightOK(lid))return '<div class="lastrow">'+badge(lid)+'<span class="grow">'+LINES[lid].name+'</span><span class="pill bad">Só seg. a sex.</span></div>';
    return lastAt(lid,from).map(function(g){
      return '<div class="lastrow">'+badge(lid)+'<span class="grow">Sentido '+g.to+'</span><span class="mono">'+tilde(lid)+fmt(g.t)+'</span>'+lastPill(g.t,now)+'</div>';
    }).join('');
  }).join('');
  return '<button class="back" type="button" data-go="home">← Voltar</button>'+
    '<div><p class="eyebrow">Segurança</p><h2>Volta à noite</h2></div>'+
    (isWeekend()&&!state.manual?weekendNote:'')+
    '<label class="fld">Onde você está?<select id="nightFrom">'+opts+'</select></label>'+top+
    (from!=='est'?(function(){var o=options(from,'est',now)[0]||lastTo(from,'est')[0];return o?warnHTML({from:from,to:'est',lid:o.lid,dep:o.dep,arr:o.arr},'night',true):''})():'')+
    '<h3>Último horário de cada linha aqui</h3><div>'+rows+'</div>'+
    '<h3>Telefones da segurança</h3><div class="calls">'+CALLS.map(function(c){
      return '<div class="callrow"><span class="grow"><b>'+c.n+'</b><small>'+c.d+'</small></span><a class="num" href="tel:'+c.raw+'">'+c.num+'</a><button class="copy" type="button" data-copy="'+c.num+'">Copiar</button></div>';
    }).join('')+'</div>'+
    '<p class="muted small">Salve esses números no celular antes de precisar. Se a ligação não abrir pelo botão, copie o número.</p>'+
    '<h3>Guaritas</h3><div class="list">'+Object.keys(GUARDS).map(function(id){
      var g=GUARDS[id];
      return '<button class="item tint" type="button" style="--c:var(--warn)" data-kind="guard" data-id="'+id+'"><span class="lb" style="--c:var(--mc-guard);color:#0A0E13">'+g.short+'</span><span class="grow">'+g.name+'<small>'+g.where+'</small></span></button>';
    }).join('')+'</div>'+
    '<h3>Dicas da Prefeitura</h3><ul class="tips">'+NTIPS.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul>';
}
function guardHTML(id){
  var g=GUARDS[id];
  var near=Object.keys(STOPS).filter(function(s){return Math.hypot(STOPS[s].p[0]-g.p[0],STOPS[s].p[1]-g.p[1])<=130});
  return '<button class="back" type="button" data-kind="night" data-id="x">← Volta à noite</button>'+
    '<div><p class="eyebrow">Segurança · guarita</p><h2>'+g.name+'</h2></div><p>'+g.where+'</p>'+
    '<p class="note">No mapa da Prefeitura, as guaritas aparecem com o nº 33, junto da Divisão de Segurança (DISEG). Em caso de problema, procure a guarita mais próxima ou ligue para a DISEG.</p>'+
    '<div class="calls">'+CALLS.slice(0,2).map(function(c){
      return '<div class="callrow"><span class="grow"><b>'+c.n+'</b><small>'+c.d+'</small></span><a class="num" href="tel:'+c.raw+'">'+c.num+'</a><button class="copy" type="button" data-copy="'+c.num+'">Copiar</button></div>';
    }).join('')+'</div>'+
    (near.length?'<h3>Paradas por perto</h3><div class="list">'+near.map(stopItem).join('')+'</div>':'');
}

/* ---------- componentes ---------- */
function badge(id){return '<span class="lb" style="--c:var('+LINES[id].color+')" title="Linha '+id+'">'+id+'</span>'}
function barsSvg(n,w,h){var hs=[3.5,6,8.5,11],s='<svg class="bars" viewBox="0 0 14 12" width="'+(w||22)+'" height="'+(h||19)+'" aria-hidden="true">';for(var i=0;i<4;i++)s+='<rect class="'+(i<n?'bf':'bo')+'" x="'+(i*3.7)+'" y="'+(12-hs[i])+'" width="2.6" height="'+hs[i]+'" rx=".7"/>';return s+'</svg>'}
function wifiItem(id){var a=avgOf(id),q=info(a);return '<button class="item" type="button" data-kind="wifi" data-id="'+id+'">'+barsSvg(q.bars)+'<span class="grow">'+WIFI[id].name+'</span><span class="mono">'+br(a)+'</span></button>'}
function stopItem(id){return '<button class="item" type="button" data-kind="stop" data-id="'+id+'"><span class="grow">'+STOPS[id].name+'</span>'+linesAt(id).map(badge).join('')+'</button>'}
function rel(t,now){var d=Math.round(t)-now;if(d<=0)return {pre:'',val:'Agora'};if(d<60)return {pre:'em',val:d+' min'};return {pre:'em',val:Math.floor(d/60)+' h '+(d%60)+' min'}}
function tilde(lid){return LINES[lid].approx?'~':''}
var weekendNote='<p class="note">Hoje é fim de semana. A página da Prefeitura só informa horários de dias úteis; confirme antes de sair.</p>';

/* ---------- planejador ---------- */
var plan=$('#plan'),detail=$('#detail');
function renderPlan(focusSel){
  var now=nowMin(),f=state.from,t=state.to,body='';
  var opt=function(sel){return SORTED.map(function(k){return '<option value="'+k+'"'+(k===sel?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('')};
  planBest=null;
  if(f===t){body='<p class="muted">Escolha pontos diferentes para origem e destino.</p>'}
  else{
    var o=options(f,t,now);
    if(!o.length){
      body=served(f,t)
        ?'<div class="next"><p><b>Sem mais circulares diretos hoje.</b></p><p class="muted">Mude o horário acima para ver as saídas de amanhã.</p></div>'
        :'<div class="next"><p><b>Nenhuma linha interna liga esses dois pontos direto.</b></p><p class="muted">Tente ir até a Estação BRT ou até o CT e trocar de linha lá.</p></div>';
    }else{
      var b=o[0],x=rel(b.dep,now);planBest=b;
      var more=passesAt(b.lid,f,now,5).filter(function(g){return g.to===b.to&&!g.last})[0];
      var later=more?more.times.filter(function(tm){return tm>b.dep+0.5}).slice(0,3):[];
      body='<div class="next"><div class="nx-top">'+badge(b.lid)+'<span>Linha '+b.lid+' · sentido '+b.to+'</span></div>'+
        '<div class="nx-big">'+(x.pre?'<span class="nx-in">passa '+x.pre+'</span>':'')+'<span class="nx-min">'+x.val+'</span></div>'+
        '<p>Embarque em <b>'+STOPS[f].name+'</b> às <span class="mono">'+tilde(b.lid)+fmt(b.dep)+'</span></p>'+
        '<p class="muted">Chega em '+STOPS[t].name+' por volta de <span class="mono">'+fmt(b.arr)+'</span> · cerca de '+Math.max(1,Math.round(b.arr-b.dep))+' min</p></div>'+
        (later.length?'<p class="later"><span class="lab">Depois</span>'+later.map(function(tm){return '<span class="mono">'+tilde(b.lid)+fmt(tm)+'</span>'}).join(' · ')+'</p>':'')+
        (o.length>1?'<div class="later"><span class="lab">Outras linhas</span>'+o.slice(1,4).map(function(c){return badge(c.lid)+' <span class="mono">'+tilde(c.lid)+fmt(c.dep)+'</span> <span class="muted small">chega '+fmt(c.arr)+'</span>'}).join(' ')+'</div>':'');
    }
  }
  var ws=wifiNearStop(t);
  var fora='<details class="det"><summary>Como chegar à Ilha do Fundão</summary><dl class="kv">'+
    '<dt>BRT</dt><dd>Desça na estação Fundão – Cidade Universitária e pegue a linha interna na Estação de Integração.</dd>'+
    '<dt>Metrô</dt><dd>Del Castilho – Nova América e ônibus 913 até a Cidade Universitária.</dd>'+
    '<dt>Ônibus</dt><dd>Linhas como 485, 4, 913, 616 e 936 são citadas pela UFRJ. Confirme no app de transporte antes de sair.</dd></dl></details>';
  plan.innerHTML='<div><p class="eyebrow">Linhas internas da UFRJ</p><h2>Seu trajeto</h2></div>'+
    (isWeekend()&&!state.manual?weekendNote:'')+
    '<div class="fromto"><label class="fld">De<select id="from">'+opt(f)+'</select></label>'+
    '<button class="swap" id="swap" type="button" aria-label="Inverter origem e destino">⇅</button>'+
    '<label class="fld">Para<select id="to">'+opt(t)+'</select></label></div>'+
    body+
    (planBest?warnHTML({from:f,to:t,lid:planBest.lid,dep:planBest.dep,arr:planBest.arr},'plan',false):'')+
    NIGHTITEM+
    (ws.length?'<h3>Wi-Fi aberto perto do destino</h3><div class="list">'+ws.map(wifiItem).join('')+'</div>':'')+fora;
  if(focusSel){var el=plan.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}

/* ---------- detalhes ---------- */
function linesHTML(){
  return (CFG.reps?(typeof RUS!=='undefined'&&RUS?filaHTML():'')+repsHTML():'')+'<div><p class="eyebrow">Guia de prédios</p></div>'+
    '<div class="list">'+Object.keys(PLACES).map(function(id){
      return '<button class="item tint" type="button" style="--c:var(--ink-3)" data-kind="stop" data-id="'+id+'"><span class="lb" style="--c:var(--ink)">'+PLACES[id].name+'</span><span class="grow">'+PLACES[id].full+'<small>Institutos, bibliotecas e horários de funcionamento</small></span></button>';
    }).join('')+'</div>'+
    NIGHTITEM+'<button class="item tint" type="button" style="--c:var(--good)" data-kind="guide" data-id="eduroam"><span class="lb" style="--c:var(--good)">Wi-Fi</span><span class="grow">Tutorial do eduroam<small>Wi-Fi global das universidades, com o login da UFRJ</small></span></button>'+
    '<div><p class="eyebrow">Transporte integrado</p><h2>Linhas internas</h2></div>'+
    '<p class="muted small">Toque numa linha para ver o itinerário, ou numa parada do mapa para ver os próximos horários.</p>'+
    '<div class="list">'+Object.keys(LINES).map(function(id){
      return '<button class="item tint" type="button" style="--c:var('+LINES[id].color+')" data-kind="line" data-id="'+id+'">'+badge(id)+'<span class="grow">'+LINES[id].name+'<small>'+LINES[id].sum+'</small></span>'+(LINES[id].susp?'<span class="pill bad">Suspensa</span>':LINES[id].aviso?'<span class="pill warn">Aviso</span>':'')+'</button>';
    }).join('')+'</div>';
}
function lineHTML(id,now){
  var l=LINES[id],h='';
  l.trips.forEach(function(tr){
    var d=tr.deps.filter(function(x){return x>=now})[0],tomorrow=d===undefined;
    if(tomorrow)d=tr.deps[0];
    tr.halves.forEach(function(hf,hi){
      var ps=tr.passes.filter(function(p){return p.half===hi||(hi>0&&p===tr.passes[0])}).filter(function(p,i,arr){return p.half===hi});
      if(hi>0){var prevLast=tr.passes.filter(function(p){return p.half===hi-1}).slice(-1)[0];if(prevLast&&ps[0]&&ps[0].stop!==prevLast.stop)ps=[ps[0]].concat(ps.slice(1));}
      h+='<h3>Sentido '+hf.to+'</h3><ol class="seq" style="--c:var('+l.color+')">'+ps.map(function(p){
        return '<li><button type="button" data-kind="stop" data-id="'+p.stop+'"><span class="nm">'+STOPS[p.stop].name+'</span><span class="mono muted">'+tilde(id)+fmt(d+p.off)+'</span></button></li>';
      }).join('')+'</ol>';
    });
    h+='<p class="muted small">'+(tomorrow?'Primeira viagem de amanhã':'Próxima viagem')+': saída às <span class="mono">'+fmt(d)+'</span> de '+STOPS[tr.passes[0].stop].name+'. Horários por parada estimados.</p>';
  });
  return '<button class="back" type="button" data-go="home">← Todas as linhas</button>'+
    '<div class="nx-top">'+badge(id)+'<h2>'+l.name+'</h2></div><p class="muted">'+l.sum+'</p>'+lineNote(id)+h;
}
function stopHTML(id,now){
  var tts=linesAt(id).map(function(k){
    var gs=passesAt(k,id,now,3);
    var rows=gs.map(function(g){
      var body;
      if(g.last)return '<div class="tt-row"><span class="tt-dir">Ponto final do sentido '+g.to+'</span></div>';
      if(!g.times.length)body='<span class="muted small">Sem mais passagens hoje. Primeira de amanhã: <span class="mono">'+tilde(k)+fmt(g.first)+'</span></span>';
      else{var x=rel(g.times[0],now);body='<div class="tt-times"><span class="mono first">'+tilde(k)+fmt(g.times[0])+'</span><span class="in">'+(x.pre?x.pre+' '+x.val:x.val)+'</span>'+g.times.slice(1).map(function(t){return '<span class="mono">'+tilde(k)+fmt(t)+'</span>'}).join('')+'</div>'}
      return '<div class="tt-row"><span class="tt-dir">Sentido '+g.to+'</span>'+body+'</div>';
    }).join('');
    return '<div class="tt"><button class="item" type="button" data-kind="line" data-id="'+k+'" style="border:0;padding:0;min-height:30px">'+badge(k)+'<span class="grow"><b>'+LINES[k].name+'</b></span>'+(LINES[k].susp?'<span class="pill bad">Suspensa</span>':'')+'</button>'+rows+'</div>';
  }).join('');
  var ws=wifiNearStop(id);
  return '<button class="back" type="button" data-go="home">← Todas as linhas</button>'+
    (PLACES[id]?placeHTML(id,now)+'<h3>Ônibus nesta parada</h3>':'<div><p class="eyebrow">Parada</p><h2>'+STOPS[id].name+'</h2></div>')+stopNote(id)+
    (isWeekend()&&!state.manual?weekendNote:'')+tts+
    '<div class="later"><button class="linkbtn" type="button" data-plan="from" style="padding-left:0">Sair daqui</button><button class="linkbtn" type="button" data-plan="to">Ir para cá</button></div>'+
    (ws.length?'<h3>Wi-Fi aberto por perto</h3><div class="list">'+ws.map(wifiItem).join('')+'</div>':'');
}
function wifiHTML(id){
  var w=WIFI[id],a=avgOf(id),q=info(a),m=mine[id],scale='';
  for(var i=1;i<=5;i++)scale+='<button type="button" data-rate="'+i+'" aria-pressed="'+(m===i)+'" aria-label="Nota '+i+' de 5">'+i+'</button>';
  var ss=stopsNearWifi(id);
  return '<button class="back" type="button" data-go="home">← Todas as linhas</button>'+
    '<div><p class="eyebrow">Wi-Fi aberto'+(isExample(id)?' · nota de exemplo':' · nota dos alunos')+'</p><h2>'+w.name+'</h2></div>'+
    '<div class="sig">'+barsSvg(q.bars,34,29)+'<span class="score"><b>'+br(a)+'</b> de 5 · '+votesOf(id)+' avaliações</span><span class="pill '+q.tone+'">'+q.label+'</span></div>'+
    '<dl class="kv"><dt>Rede</dt><dd>'+esc(w.ssid||'Nome a confirmar no local')+'</dd><dt>Acesso</dt><dd>'+esc(w.acesso||'Sem senha')+'</dd><dt>Dica</dt><dd>'+esc(w.note||'—')+'</dd></dl>'+
    '<div class="warnbox"><b>Atenção</b>Rede aberta não tem criptografia. Evite entrar no banco ou digitar senhas importantes aqui. Para isso, use os dados móveis.</div>'+
    '<div class="rate"><p><b>Como está o sinal aqui agora?</b></p><div class="scale" role="group" aria-label="Nota do sinal">'+scale+'</div><div class="ends"><span>Fraco</span><span>Forte</span></div>'+
    (m?'<p class="muted small">Sua nota: '+m+'. '+(SH.on&&SH.uid&&!SH.denied?'Entra na média de todos.':'Salva só neste aparelho.')+'</p>':'')+(SH.on&&(SH.denied||SH.write===false)?'<p class="muted small">Para sua nota contar na média, o dono da página precisa te dar acesso de colaborador.</p>':'')+'</div>'+
    '<button class="item tint" type="button" style="--c:var(--good)" data-kind="guide" data-id="eduroam"><span class="lb" style="--c:var(--good)">Wi-Fi</span><span class="grow">Prefira o eduroam<small>Rede segura com o login da UFRJ. Veja como conectar.</small></span></button>'+
    (ss.length?'<h3>Paradas por perto</h3><div class="list">'+ss.map(stopItem).join('')+'</div>':'');
}
function renderDetail(focusSel){
  var now=nowMin(),s=state.sel,h;
  if(!s)h=linesHTML();
  else if(s.kind==='line')h=lineHTML(s.id,now);
  else if(s.kind==='guide')h=eduHTML();
  else if(s.kind==='place')h='<button class="back" type="button" data-go="home">← Voltar</button>'+placeCard(s.id,now,true)+repBlock('pl:'+s.id);
  else if(s.kind==='night')h=nightHTML(now);
  else if(s.kind==='guard')h=guardHTML(s.id);
  else if(s.kind==='svc')h=svcHTML(s.id);
  else if(s.kind==='stop')h=stopHTML(s.id,now)+repBlock('stop:'+s.id);
  else h=wifiHTML(s.id)+repBlock('wifi:'+s.id);
  detail.innerHTML=h;
  if(focusSel){var el=detail.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}
function renderAll(){renderPlan();renderDetail();updateMap()}
function select(kind,id,scroll){
  state.sel={kind:kind,id:id};
  renderAll();
  if(kind==='svc'&&SVCMAP[id])ensureVisible(SVCMAP[id].p);else if(kind==='stop'&&STOPS[id])ensureVisible(STOPS[id].p);else if(kind==='wifi'&&WIFI[id])ensureVisible(WIFI[id].p);else if(kind==='guard'&&GUARDS[id])ensureVisible(GUARDS[id].p);else if(kind==='night'&&STOPS[state.nightFrom])ensureVisible(STOPS[state.nightFrom].p);
  if(scroll&&window.matchMedia('(max-width:859px)').matches){
    detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
  }
}

/* ---------- eventos ---------- */
svg.addEventListener('click',function(e){
  if(suppressClick){suppressClick=false;return}
  var g=e.target.closest('.mk');
  if(g)select(g.dataset.kind,g.dataset.id,true);
  else if(state.sel){state.sel=null;renderAll()}
});
svg.addEventListener('keydown',function(e){
  if(e.key==='Enter'||e.key===' '){var g=e.target.closest('.mk');if(g){e.preventDefault();select(g.dataset.kind,g.dataset.id,true)}}
});
function onPanelClick(e){
  var t=e.target.closest('[data-go],[data-rate],[data-kind],[data-plan],#swap');
  if(!t)return;
  if(t.id==='swap'){var x=state.from;state.from=state.to;state.to=x;savePrefs();renderPlan('#swap');updateMap();return}
  if(t.dataset.go==='home'){state.sel=null;renderAll();return}
  if(t.dataset.plan&&state.sel){
    var sid=state.sel.id;
    if(t.dataset.plan==='from'){state.from=sid;if(state.to===sid)state.to=sid==='est'?'ctl':'est'}
    else{state.to=sid;if(state.from===sid)state.from=sid==='est'?'ctl':'est'}
    savePrefs();state.sel=null;renderAll();
    plan.scrollIntoView({behavior:'auto',block:'nearest'});return;
  }
  if(t.dataset.rate&&state.sel){mine[state.sel.id]=+t.dataset.rate;saveMine();writeVotes();drawShared();renderDetail('[data-rate="'+t.dataset.rate+'"]');renderPlan();updateMap();return}
  if(t.dataset.kind)select(t.dataset.kind,t.dataset.id,this===plan);
}
plan.addEventListener('click',onPanelClick);
detail.addEventListener('click',onPanelClick);
detail.addEventListener('change',function(e){
  if(e.target.id==='nightFrom'){state.nightFrom=e.target.value;renderDetail('#nightFrom');updateMap();return}
  var i=e.target.dataset&&e.target.dataset.edu;
  if(i===undefined)return;
  if(e.target.checked)eduDone[i]=1;else delete eduDone[i];
  try{localStorage.setItem(DKEY,JSON.stringify(eduDone))}catch(err){}
  renderDetail('#edu'+i);
});
plan.addEventListener('change',function(e){
  if(e.target.id==='from'||e.target.id==='to'){
    state[e.target.id]=e.target.value;savePrefs();
    if(state.sel){state.sel=null;renderDetail()}
    renderPlan('#'+e.target.id);updateMap();
  }
});
function setLayer(key,btn){
  state.layers[key]=!state.layers[key];
  btn.setAttribute('aria-pressed',String(state.layers[key]));
  if(state.sel&&(((state.sel.kind==='stop'||state.sel.kind==='line')&&!state.layers.bus)||(state.sel.kind==='wifi'&&!state.layers.wifi)||(state.sel.kind==='svc'&&!state.layers.svc)))state.sel=null;
  renderAll();
}
$('#chBus').addEventListener('click',function(){setLayer('bus',this)});
$('#nightBtn').addEventListener('click',function(){state.nightFrom=state.nightFrom||state.to;select('night','x',true)});
detail.addEventListener('click',function(e){
  var c=e.target.closest('[data-copy]');if(!c)return;
  var txt=c.dataset.copy,lab=c.textContent;
  function done(ok){c.textContent=ok?'Copiado':'Selecione o número';setTimeout(function(){c.textContent=lab},1600)}
  try{navigator.clipboard.writeText(txt).then(function(){done(true)},function(){selectNum(c);done(false)})}catch(err){selectNum(c);done(false)}
});
function selectNum(c){var n=c.parentNode.querySelector('.num');if(!n)return;var r=document.createRange();r.selectNodeContents(n);var s=window.getSelection();s.removeAllRanges();s.addRange(r)}
$('#chWifi').addEventListener('click',function(){setLayer('wifi',this)});
var clk=$('#clk'),nowBtn=$('#nowBtn');
clk.value=fmt(realNow());
clk.addEventListener('input',function(){
  if(clk.value){state.manual=true;state.clk=clk.value;nowBtn.hidden=false}
  else{state.manual=false;state.clk='';nowBtn.hidden=true;clk.value=fmt(realNow())}
  renderAll();
});
nowBtn.addEventListener('click',function(){state.manual=false;state.clk='';nowBtn.hidden=true;clk.value=fmt(realNow());renderAll()});
setInterval(function(){
  if(state.manual)return;
  clk.value=fmt(realNow());
  var a=document.activeElement;
  if(!plan.contains(a)&&!detail.contains(a)&&!(a&&a.classList&&a.classList.contains('wtxt')))renderAll();
  if(!pPane.contains(a))renderPredios();
  if(gPane&&!gPane.contains(a))renderGrade();
  drawShared();
},30000);

/* ======================= utilidades ======================= */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function agoTxt(ts){var m=Math.max(0,Math.round((Date.now()-ts)/60000));return m<1?'agora':m<60?'há '+m+' min':'há '+Math.floor(m/60)+' h '+(m%60?m%60+' min':'')}

/* ======================= 3. camada de serviços ======================= */
/* posições tiradas do mapa de serviços da Prefeitura (2022) e alinhadas ao mapa base por ajuste local com 34 pontos de referência (prédios, rotatórias, guaritas) */
var SVC_T={
  banco:{n:'Banco',c:'#2E9E4F',g:'$',grp:'dinheiro'},
  farmacia:{n:'Farmácia',c:'#D43C3C',g:'+',grp:'saude'},
  lab:{n:'Lab. de análises clínicas',c:'#9B2335',g:'◆',grp:'saude'},
  ru:{n:'Restaurante Universitário',c:'#E8572B',g:'RU',grp:'comida'},
  rest:{n:'Restaurante / lanchonete',c:'#F08A24',g:'⑂',grp:'comida'},
  papel:{n:'Papelaria',c:'#E0457B',g:'✎',grp:'compras'},
  banca:{n:'Banca de jornal',c:'#3E8ED0',g:'≡',grp:'compras'},
  correio:{n:'Correios',c:'#5B5FC7',g:'✉',grp:'compras'},
  chave:{n:'Chaveiro',c:'#7B3FB5',g:'⚷',grp:'compras'},
  bici:{n:'Bicicletário',c:'#D9A400',g:'⚲',grp:'transp'},
  taxi:{n:'Ponto de táxi',c:'#D9A400',g:'T',grp:'transp'},
  heli:{n:'Heliponto',c:'#3A3F46',g:'H',grp:'transp'}
};
var SVC_G=[['todos','Todos'],['comida','Comer'],['dinheiro','Banco'],['saude','Saúde'],['compras','Papelaria e correio'],['transp','Táxi e bicicleta']];
var SVC=[{"id": "bici1", "t": "bici", "p": [380, 146], "near": "Alojamento"}, {"id": "banco1", "t": "banco", "p": [392, 184], "near": "Bio-Rio"}, {"id": "rest1", "t": "rest", "p": [456, 241], "near": "EEFD"}, {"id": "farmacia1", "t": "farmacia", "p": [310, 267], "near": "Estação BRT"}, {"id": "lab1", "t": "lab", "p": [328, 264], "near": "CCS"}, {"id": "rest2", "t": "rest", "p": [347, 261], "near": "CCS"}, {"id": "papel1", "t": "papel", "p": [368, 258], "near": "CCS"}, {"id": "correio1", "t": "correio", "p": [389, 257], "near": "CCS"}, {"id": "lab2", "t": "lab", "p": [442, 302], "near": "EEFD"}, {"id": "banca1", "t": "banca", "p": [444, 339], "near": "EEFD"}, {"id": "bici2", "t": "bici", "p": [289, 332], "near": "Estação BRT"}, {"id": "banco2", "t": "banco", "p": [317, 322], "near": "Estação BRT"}, {"id": "correio2", "t": "correio", "p": [334, 321], "near": "Estação BRT"}, {"id": "banca2", "t": "banca", "p": [353, 321], "near": "CCS"}, {"id": "farmacia2", "t": "farmacia", "p": [373, 320], "near": "CCS"}, {"id": "banco3", "t": "banco", "p": [365, 355], "near": "HU"}, {"id": "rest3", "t": "rest", "p": [384, 365], "near": "HU"}, {"id": "taxi1", "t": "taxi", "p": [371, 374], "near": "HU"}, {"id": "taxi2", "t": "taxi", "p": [383, 389], "near": "HU"}, {"id": "rest4", "t": "rest", "p": [400, 402], "near": "HU"}, {"id": "bici3", "t": "bici", "p": [421, 466], "near": "Prefeitura"}, {"id": "taxi3", "t": "taxi", "p": [596, 421], "near": "CEPEL"}, {"id": "taxi4", "t": "taxi", "p": [662, 480], "near": "CENPES"}, {"id": "rest5", "t": "rest", "p": [650, 515], "near": "CENPES"}, {"id": "lab3", "t": "lab", "p": [668, 515], "near": "CENPES"}, {"id": "banco4", "t": "banco", "p": [742, 442], "near": "IF"}, {"id": "rest6", "t": "rest", "p": [1138, 281], "near": "Incubadora"}, {"id": "rest7", "t": "rest", "p": [1033, 330], "near": "Reitoria"}, {"id": "banca3", "t": "banca", "p": [1032, 353], "near": "Reitoria"}, {"id": "papel2", "t": "papel", "p": [1045, 340], "near": "Reitoria"}, {"id": "rest8", "t": "rest", "p": [1074, 342], "near": "Reitoria"}, {"id": "rest9", "t": "rest", "p": [1095, 342], "near": "Incubadora"}, {"id": "bici4", "t": "bici", "p": [1025, 392], "near": "Reitoria"}, {"id": "banco5", "t": "banco", "p": [938, 410], "near": "Faculdade de Letras"}, {"id": "rest10", "t": "rest", "p": [952, 410], "near": "Faculdade de Letras"}, {"id": "taxi5", "t": "taxi", "p": [966, 410], "near": "Faculdade de Letras"}, {"id": "ru1", "t": "ru", "p": [979, 403], "near": "Faculdade de Letras"}, {"id": "bici5", "t": "bici", "p": [976, 421], "near": "Faculdade de Letras"}, {"id": "papel3", "t": "papel", "p": [1040, 408], "near": "Reitoria"}, {"id": "rest11", "t": "rest", "p": [1056, 408], "near": "Reitoria"}, {"id": "banca4", "t": "banca", "p": [1042, 420], "near": "Reitoria"}, {"id": "bici6", "t": "bici", "p": [814, 446], "near": "CT"}, {"id": "banco6", "t": "banco", "p": [838, 445], "near": "CT"}, {"id": "correio3", "t": "correio", "p": [858, 445], "near": "CT"}, {"id": "rest12", "t": "rest", "p": [880, 445], "near": "CT"}, {"id": "chave1", "t": "chave", "p": [902, 445], "near": "CT"}, {"id": "ru2", "t": "ru", "p": [845, 509], "near": "CT"}, {"id": "papel4", "t": "papel", "p": [865, 509], "near": "CT"}, {"id": "banca5", "t": "banca", "p": [885, 509], "near": "CT"}, {"id": "chave2", "t": "chave", "p": [905, 509], "near": "CT"}, {"id": "rest13", "t": "rest", "p": [945, 490], "near": "IMA"}, {"id": "banco7", "t": "banco", "p": [956, 490], "near": "IMA"}, {"id": "taxi6", "t": "taxi", "p": [974, 455], "near": "IMA"}, {"id": "rest14", "t": "rest", "p": [835, 530], "near": "CT"}, {"id": "rest15", "t": "rest", "p": [880, 528], "near": "CT"}, {"id": "rest16", "t": "rest", "p": [945, 539], "near": "Xistoquímica"}, {"id": "rest17", "t": "rest", "p": [790, 548], "near": "CCMN"}, {"id": "heli1", "t": "heli", "p": [1278, 286], "near": "Parque Tecnológico"}];
var SVCMAP={};SVC.forEach(function(s){s.name=SVC_T[s.t].n;s.full=SVC_T[s.t].n+' · perto de '+s.near;SVCMAP[s.id]=s});
state.layers.svc=false;state.svcGrp='todos';
function svcMarker(s){
  var T=SVC_T[s.t],g=T.g,fs=g.length>1?10:13,fg=(s.t==='bici'||s.t==='taxi')?'#1B1500':'#fff';
  return mk('svc',s.id,s.p,T.n+' perto de '+s.near,'<circle class="hit" r="18"/><rect x="-11" y="-11" width="22" height="22" rx="6" fill="'+T.c+'" stroke="#0A0E13" stroke-width="2"/><text class="svc-g" y="0.5" fill="'+fg+'" style="font-size:'+fs+'px">'+g+'</text>');
}
function svcVisible(s){return state.layers.svc&&(state.svcGrp==='todos'||SVC_T[s.t].grp===state.svcGrp)}
function svcHTML(id){
  var s=SVCMAP[id],T=SVC_T[s.t];
  var near=Object.keys(STOPS).map(function(k){return {k:k,d:Math.hypot(STOPS[k].p[0]-s.p[0],STOPS[k].p[1]-s.p[1])}}).sort(function(a,b){return a.d-b.d}).slice(0,2).map(function(x){return x.k});
  return '<button class="back" type="button" data-go="home">← Voltar</button>'+
    '<div><p class="eyebrow">Serviço</p><h2>'+T.n+'</h2></div><p>Perto de <b>'+esc(s.near)+'</b>.</p>'+
    (s.t==='ru'?'<p class="small">Horários dos RUs na aba <b>Lugares</b>.</p>':'')+
    '<p class="note">Posição tirada do mapa de serviços da Prefeitura Universitária (2022). O serviço pode ter mudado de lugar ou fechado; confirme no local.</p>'+
    repBlock('svc:'+id)+
    '<h3>Paradas mais próximas</h3><div class="list">'+near.map(stopItem).join('')+'</div>';
}

/* ======================= 2. avaliações e avisos compartilhados ======================= */
var SH={on:false,db:null,uid:null,write:null,denied:false,votes:{},reps:[],busyV:false,pendV:false};
var REP_K=[['fila','Fila grande'],['onibus','Ônibus atrasado ou lotado'],['wifi','Wi-Fi fora do ar'],['fechado','Local fechado'],['elevador','Elevador ou escada com problema'],['limpeza','Banheiro sem condições'],['seguranca','Situação suspeita'],['outro','Outro']];
var REP_TTL=4*60*60*1000;
function repLabel(k){for(var i=0;i<REP_K.length;i++)if(REP_K[i][0]===k)return REP_K[i][1];return 'Aviso'}
function placeOf(key){
  var a=String(key||'').split(':'),t=a[0],id=a[1];
  if(t==='stop'&&STOPS[id])return {name:STOPS[id].name,p:STOPS[id].p,kind:'stop',id:id};
  if(t==='wifi'&&WIFI[id])return {name:WIFI[id].name,p:WIFI[id].p,kind:'wifi',id:id};
  if(t==='pl'&&PL[id]&&PL[id].p)return {name:PL[id].name,p:PL[id].p,kind:'place',id:id};
  if(t==='svc'&&SVCMAP[id])return {name:SVCMAP[id].full,p:SVCMAP[id].p,kind:'svc',id:id};
  return null;
}
function liveReps(){var now=Date.now();return SH.reps.filter(function(r){return r.ts>now-REP_TTL&&r.ts<now+5*60000&&placeOf(r.place)&&!(typeof GST!=='undefined'&&GST&&blocked(r.owner))})}
function aggVotes(docs){
  var v={};
  docs.forEach(function(d){var r=(d.data()||{}).r;if(!r||typeof r!=='object')return;Object.keys(r).forEach(function(w){var n=+r[w];if(!WIFI[w]||!(n>=1&&n<=5))return;if(!v[w])v[w]={s:0,n:0};v[w].s+=n;v[w].n++})});
  return v;
}
function flatReps(docs){
  var out=[];
  docs.forEach(function(d){var it=(d.data()||{}).items;if(!Array.isArray(it))return;it.slice(0,10).forEach(function(r){if(!r||typeof r!=='object')return;
    out.push({id:String(r.id||''),k:String(r.k||'outro'),place:String(r.place||''),txt:String(r.txt||'').slice(0,90),ts:+r.ts||0,mine:d.id===SH.uid,owner:d.id})})});
  return out.sort(function(a,b){return b.ts-a.ts});
}
function isExample(id){return !(SH.on&&SH.votes[id]&&SH.votes[id].n)}
avgOf=function(id){
  if(SH.on){var v=SH.votes[id];if(v&&v.n)return v.s/v.n;return WIFI[id].avg}
  var w=WIFI[id],m=mine[id];return m?(w.avg*w.votes+m)/(w.votes+1):w.avg;
};
votesOf=function(id){
  if(SH.on){var v=SH.votes[id];return v&&v.n?v.n:WIFI[id].votes}
  return WIFI[id].votes+(mine[id]?1:0);
};
function writeVotes(){
  if(!SH.on||!SH.uid||SH.denied)return;
  if(SH.busyV){SH.pendV=true;return}
  SH.busyV=true;
  SH.db.doc('votes/'+SH.uid).set({r:Object.assign({},mine),ts:Date.now()}).then(function(){SH.busyV=false;if(SH.pendV){SH.pendV=false;writeVotes()}},function(){SH.busyV=false;SH.pendV=false;SH.denied=true;refreshAll()});
}
var repBusy=false;
function sendReport(k,place,txt){
  if(!SH.on||!SH.uid||SH.denied||repBusy)return Promise.resolve(false);
  repBusy=true;
  var now=Date.now(),mineL=SH.reps.filter(function(r){return r.mine&&r.ts>now-REP_TTL}).map(function(r){return {id:r.id,k:r.k,place:r.place,txt:r.txt,ts:r.ts}});
  mineL.unshift({id:'r'+now.toString(36),k:k,place:place,txt:String(txt||'').slice(0,90),ts:now});
  return SH.db.doc('reports/'+SH.uid).set({items:mineL.slice(0,5)}).then(function(){repBusy=false;return true},function(){repBusy=false;SH.denied=true;refreshAll();return false});
}
function removeReport(id){
  if(!SH.on||!SH.uid||repBusy)return;
  repBusy=true;
  var now=Date.now(),keep=SH.reps.filter(function(r){return r.mine&&r.id!==id&&r.ts>now-REP_TTL}).map(function(r){return {id:r.id,k:r.k,place:r.place,txt:r.txt,ts:r.ts}});
  SH.db.doc('reports/'+SH.uid).set({items:keep}).then(function(){repBusy=false},function(){repBusy=false});
}
function repItem(r){
  var pl=placeOf(r.place);
  return '<div class="rep"><span class="rep-k">'+esc(repLabel(r.k))+'</span><span class="grow"><button type="button" class="linkbtn rep-pl" data-repgo="'+esc(r.place)+'">'+esc(pl?pl.name:'')+'</button>'+(r.txt?'<small>“'+esc(r.txt)+'”</small>':'')+'</span><span class="muted small">'+agoTxt(r.ts)+'</span>'+(r.mine?'<button type="button" class="copy" data-repdel="'+esc(r.id)+'">Apagar</button>':'')+'</div>';
}
function repBlock(key){
  var l=liveReps().filter(function(r){return r.place===key});
  if(!l.length)return '';
  return '<h3>Avisos dos alunos aqui</h3><div class="reps">'+l.map(repItem).join('')+'</div>';
}
function repFormHTML(defPlace){
  if(SH.on&&typeof GST!=='undefined'&&GST&&blocked(SH.uid))return '<p class="muted small">Sua conta não pode enviar avisos no momento (decisão da gestão).</p>';
  if(!SH.on)return '<p class="muted small">Os avisos aparecem quando a página está aberta no claude.ai com sua conta.</p>';
  if(SH.denied||SH.write===false)return '<p class="muted small">Você pode ler os avisos. Para enviar, o dono da página precisa te dar acesso de colaborador.</p>';
  var places=[];
  Object.keys(STOPS).forEach(function(k){places.push(['stop:'+k,'Parada · '+STOPS[k].name])});
  Object.keys(PL).forEach(function(k){if(PL[k].p&&PL[k].cat!=='aula')places.push(['pl:'+k,PL[k].name])});
  Object.keys(WIFI).forEach(function(k){places.push(['wifi:'+k,'Wi-Fi · '+WIFI[k].name])});
  return '<details class="det" id="repdet"><summary>Enviar um aviso</summary><form class="repform" id="repform">'+
    '<label class="fld">O que está acontecendo?<select id="repk">'+REP_K.map(function(k){return '<option value="'+k[0]+'">'+k[1]+'</option>'}).join('')+'</select></label>'+
    '<label class="fld">Onde?<select id="repp">'+places.map(function(p){return '<option value="'+esc(p[0])+'"'+(p[0]===defPlace?' selected':'')+'>'+esc(p[1])+'</option>'}).join('')+'</select></label>'+
    '<label class="fld">Detalhe (opcional)<input type="text" id="rept" maxlength="90" placeholder="Ex.: fila até a porta"></label>'+
    '<button class="copy sendrep" type="submit">Publicar aviso</button>'+
    '<p class="muted small keep">O aviso some sozinho em 4 horas. Seu nome não aparece para os colegas. Em emergência, ligue para a DISEG: (21) 97380-2554.</p></form></details>';
}
function repsHTML(){
  var l=liveReps();
  return '<div class="repbox"><div class="plc-h"><div><p class="eyebrow">Ao vivo · últimas 4 horas</p><h3 class="plc-t">Avisos dos alunos</h3></div>'+(SH.on?'<span class="pill good">Compartilhado</span>':'<span class="pill warn">Offline</span>')+'</div>'+
    (l.length?'<div class="reps">'+l.slice(0,6).map(repItem).join('')+'</div>':'<p class="muted small">Nenhum aviso agora. Viu fila grande no RU, ônibus lotado ou Wi-Fi fora do ar? Avise os colegas.</p>')+
    repFormHTML('')+'</div>';
}
var gSvc,gRep;
function drawShared(){
  if(!gRep)return;
  var seen={},s='';
  liveReps().forEach(function(r){if(seen[r.place])return;seen[r.place]=1;var pl=placeOf(r.place);
    s+=mk('rep',r.place,[pl.p[0]+12,pl.p[1]-14],'Aviso: '+repLabel(r.k)+' em '+pl.name,'<circle class="hit" r="14"/><circle r="9" class="rep-dot"/><text class="rep-x" y="0.5">!</text>')});
  if(typeof RUS!=='undefined'&&RUS){var used={};RUS.forEach(function(k){var f=filaOf(k),pp=PL[k].p;if(!f||!pp)return;var key=pp.join(','),off=used[key]=(used[key]||0)+1;
    var L=FILA_N[f.n],x=pp[0]+(off-1)*50-(off>1?0:0),y=pp[1]-26;
    s+=mk('place fila f'+f.n,k,[x,y],'Fila no '+PL[k].name+': '+L[0]+', '+L[1],'<rect class="hit" x="-30" y="-16" width="60" height="32" rx="16"/><rect class="fila-pl" x="-24" y="-12" width="48" height="24" rx="12"/><text class="fila-tx" y="0.5">'+(f.n?L[3]+'′':'livre')+'</text>').replace(/data-kind="[^"]*"/,'data-kind="place"')})}
  gRep.innerHTML=CFG.reps?s:'';
  svg.querySelectorAll('.mk.wifi').forEach(function(el){$('.wbars',el).innerHTML=mbars(info(avgOf(el.dataset.id)).bars)});
  schedule();
}
function refreshAll(){
  var a=document.activeElement;
  if(!detail.contains(a)||!(a&&(a.tagName==='INPUT'||a.tagName==='SELECT')))renderDetail();
  drawShared();
  if(!pPane.hidden&&!pPane.contains(a))renderPredios();
}
function initShared(){
  if(!window.claude||typeof window.claude.use!=='function')return;
  Promise.all([window.claude.use('db'),window.claude.use('user')]).then(function(r){
    var db=r[0],user=r[1];if(!db)return;
    SH.db=db;SH.user=user;
    return (user?user.id():Promise.resolve(null)).then(function(uid){
      SH.uid=uid;SH.on=true;if(uid&&typeof accClaude==='function')accClaude(user,uid);
      if(user)user.can('data.write').then(function(c){if(c===false){SH.write=false;refreshAll()}});
      db.collection('votes').onSnapshot(function(s){SH.votes=aggVotes(s.docs);refreshAll()},function(){});
      db.collection('cal').onSnapshot(function(s){MUD_DB=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,d:String(x.d||''),de:x.de?String(x.de):'',t:String(x.t||'').slice(0,60),k:String(x.k||'facultativo'),txt:String(x.txt||'').slice(0,240),src:/^https:\/\//.test(x.src||'')?String(x.src):''}});drawBanner();refreshAll();if(cPane&&!cPane.hidden&&!cPane.contains(document.activeElement))renderCal()},function(){});
      if(user)user.canEdit().then(function(o){MUD_OWNER=o;if(o&&cPane&&!cPane.hidden)renderCal();if(o)setGestor(true)});
      db.collection('fila').onSnapshot(function(s){SH.fila=flatFila(s.docs);refreshAll();drawShared();if(gestM&&!gestM.hidden)renderGest()},function(){});
      db.collection('gestao').onSnapshot(function(s){var seen={};s.docs.forEach(function(d){if(GKEYS.indexOf(d.id)<0)return;var v=(d.data()||{}).v;if(v&&typeof v==='object'){GST[d.id]=v;seen[d.id]=1}});
        GKEYS.forEach(function(k){if(!seen[k])GST[k]=k==='plantas'?{items:[]}:k==='bloqueados'?{ids:[]}:{}});if(!Array.isArray(GST.plantas.items))GST.plantas.items=[];if(!Array.isArray(GST.bloqueados.ids))GST.bloqueados.ids=[];
        rebuildAll();if(!cfgM.hidden)renderCfg()},function(){});
      db.collection('reports').onSnapshot(function(s){SH.reps=flatReps(s.docs);refreshAll();if(gestM&&!gestM.hidden)renderGest()},function(){});
      if(uid){
        db.doc('votes/'+uid).get().then(function(d){if(d.exists){var rr=(d.data()||{}).r||{};Object.keys(rr).forEach(function(k){if(WIFI[k]&&rr[k]>=1&&rr[k]<=5)mine[k]=+rr[k]});saveMine()}else if(Object.keys(mine).length){writeVotes()}refreshAll()},function(){});
        loadGrade();trackMember(uid);
        db.doc('requests/'+uid).onSnapshot(function(d){var it=d.exists?((d.data()||{}).items||[]):[];SH.myReq=flatReq([{id:uid,data:function(){return {items:it}}}]);if(!cfgM.hidden)renderCfg()},function(){});
      }else SH.write=false;
      refreshAll();
    });
  }).catch(function(){});
}

/* ======================= 1. minha grade ======================= */
var DIAS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
var GBLK={ct:['A','B','C','D','E','F','G','H','I','J'],ccmn:['A','B','C','D','E','F','G','H','I']};
var GEX=[
  {id:'ex1',nome:'Cálculo I',bld:'ct',b:'H',sala:'210',dias:[1,3,5],ini:'08:00',fim:'10:00',ex:1},
  {id:'ex2',nome:'Física I',bld:'ct',b:'A',sala:'312',dias:[2,4],ini:'10:00',fim:'12:00',ex:1},
  {id:'ex3',nome:'Programação',bld:'ccmn',b:'C',sala:'105',dias:[2,4],ini:'13:00',fim:'15:00',ex:1}
];
var GKEY='cse-ufrj-grade-v1',GRADE=null,gBusy=false,gPend=false;
try{GRADE=JSON.parse(localStorage.getItem(GKEY))}catch(e){GRADE=null}
if(!Array.isArray(GRADE))GRADE=null;
var gs={from:'est',form:false};
function gradeList(){return GRADE&&GRADE.length?GRADE:GEX}
function usingExample(){return !(GRADE&&GRADE.length)}
function saveGrade(){
  try{localStorage.setItem(GKEY,JSON.stringify(GRADE||[]))}catch(e){}
  if(SH.on&&SH.uid){
    if(gBusy){gPend=true;return}
    gBusy=true;
    SH.db.doc('data/users/'+SH.uid+'/grade').set({items:GRADE||[],ts:Date.now()}).then(function(){gBusy=false;if(gPend){gPend=false;saveGrade()}},function(){gBusy=false;gPend=false});
  }
}
function loadGrade(){
  if(!SH.on||!SH.uid)return;
  SH.db.doc('data/users/'+SH.uid+'/grade').get().then(function(d){
    if(d.exists){var it=(d.data()||{}).items;if(Array.isArray(it)){GRADE=it.filter(function(x){return x&&x.nome}).slice(0,40);try{localStorage.setItem(GKEY,JSON.stringify(GRADE))}catch(e){}syncAulas();renderGrade()}}
    else if(GRADE&&GRADE.length)saveGrade();
  },function(){});
}
function salaFloor(sala){var m=/(\d{1,3})/.exec(String(sala||''));if(!m)return null;var n=parseInt(m[1],10);return m[1].length>=3||n>=100?Math.floor(n/100):0}
function aulaStop(a){return a.bld==='ct'?'ctl':a.bld==='ccmn'?'ccmn':(STOPS[a.stop]?a.stop:'ctl')}
function aulaFloor(a){return a.andar!==undefined&&a.andar!==null&&a.andar!==''?+a.andar:salaFloor(a.sala)}
function aulaWhere(a){var hasA=a.andar!==undefined&&a.andar!==null&&a.andar!=='';return (a.bld==='ct'?'CT':a.bld==='ccmn'?'CCMN':(STOPS[a.stop]?STOPS[a.stop].name:''))+(a.b&&a.bld!=='outro'?', Bloco '+a.b:'')+(hasA?', '+(+a.andar===0?'térreo':a.andar+'º andar'):'')+(a.sala?', sala '+a.sala:'')}
function syncAulas(){
  Object.keys(PL).forEach(function(k){if(PL[k].cat==='aula')delete PL[k]});
  gradeList().forEach(function(a){
    if(a.bld!=='ct'&&a.bld!=='ccmn')return;
    PL['aula_'+a.id]={s:a.nome,name:a.nome+' (aula)',cat:'aula',where:aulaWhere(a),bld:a.bld,b:a.b,f:aulaFloor(a),wk:null,note:'Sua aula: '+a.dias.map(function(d){return DIAS[d]}).join(', ')+', '+a.ini+'–'+a.fim+'.'};
  });
}
function todayDow(){return new Date().getDay()}
function nextClass(now){
  var dow=todayDow(),best=null;
  gradeList().forEach(function(a){
    var ini=toMin(a.ini),fim=toMin(a.fim);
    (a.dias||[]).forEach(function(d){
      var dd=(d-dow+7)%7,start=dd*1440+ini,end=dd*1440+fim;
      if(dd===0&&end<=now)start+=7*1440;
      var rel=start-now;
      if(!best||rel<best.rel)best={a:a,rel:rel,dd:dd===0&&end<=now?7:dd,ini:ini,fim:fim,going:dd===0&&now>=ini&&now<fim};
    });
  });
  return best;
}
function arriveBy(from,to,T,after){
  var best=null;
  Object.keys(LINES).forEach(function(lid){
    if(LINES[lid].susp)return;
    LINES[lid].trips.forEach(function(tr){
      for(var i=0;i<tr.passes.length;i++){
        if(tr.passes[i].stop!==from)continue;
        for(var j=i+1;j<tr.passes.length;j++){
          if(tr.passes[j].stop!==to)continue;
          tr.deps.forEach(function(d){var dep=d+tr.passes[i].off,arr=d+tr.passes[j].off;if(dep>=after&&arr<=T-5&&(!best||dep>best.dep))best={lid:lid,dep:dep,arr:arr}});
          break;
        }
      }
    });
  });
  return best;
}
function whenTxt(n){
  if(n.going)return 'agora, até '+fmt(n.fim);
  if(n.dd===0)return 'hoje às '+fmt(n.ini);
  if(n.dd===1)return 'amanhã às '+fmt(n.ini);
  return DIAS[(todayDow()+n.dd)%7].toLowerCase()+(n.dd===7?' que vem':'')+' às '+fmt(n.ini);
}
function inTxt(m){if(m<=0)return '';if(m<60)return 'em '+m+' min';var h=Math.floor(m/60);return h<24?'em '+h+' h '+(m%60?m%60+' min':''):'em '+Math.floor(h/24)+' dia'+(h>=48?'s':'')}
function gradeNextHTML(now){
  var n=nextClass(now);
  if(!n)return '<p class="muted">Cadastre uma aula para ver aqui a próxima e como chegar.</p>';
  var a=n.a,to=aulaStop(a),from=gs.from;
  var opts=SORTED.map(function(k){return '<option value="'+k+'"'+(k===from?' selected':'')+'>'+STOPS[k].name+'</option>'}).join('');
  var how='';
  if(from===to)how='<p class="small">Você já está na parada da aula.</p>';
  else{
    var r=arriveBy(from,to,n.ini,n.dd===0&&!n.going?now:0);
    if(n.going||(n.dd===0&&!r)){var o=options(from,to,now);r=null;
      how=o.length?'<p class="small"><b>Vá agora:</b> '+badge(o[0].lid)+' passa às <span class="mono">'+tilde(o[0].lid)+fmt(o[0].dep)+'</span> e chega às <span class="mono">'+fmt(o[0].arr)+'</span>.</p>':'<p class="small">Nenhum circular direto agora entre esses pontos.</p>';}
    else if(r)how='<p class="small">'+badge(r.lid)+' <b>Linha '+r.lid+'</b> às <span class="mono">'+tilde(r.lid)+fmt(r.dep)+'</span> em '+STOPS[from].name+', chega às <span class="mono">'+fmt(r.arr)+'</span>, antes do início.</p>';
    else how='<p class="small">Nenhum circular direto chega a tempo. Tente sair da Estação BRT.</p>';
  }
  var plan=(a.bld==='ct'||a.bld==='ccmn')?'<button class="copy" type="button" data-gplan="'+esc(a.id)+'">Ver planta da sala</button>':'';
  return '<div class="next lastbig"><p class="eyebrow">Próxima aula</p><h3 class="plc-t">'+esc(a.nome)+'</h3>'+
    '<div class="nx-big"><span class="nx-min" style="font-size:28px">'+whenTxt(n)+'</span>'+(n.going?'<span class="pill good">Em andamento</span>':'<span class="muted">'+inTxt(n.rel)+'</span>')+'</div>'+
    '<p class="muted small">'+esc(aulaWhere(a))+'</p>'+
    '<label class="fld">Vou sair de<select id="gfrom">'+opts+'</select></label>'+how+
    '<div class="later">'+plan+'<button class="copy" type="button" data-gmap="'+esc(a.id)+'">Ver parada no mapa</button></div></div>';
}
function gradeWeekHTML(){
  var list=gradeList(),out='';
  [1,2,3,4,5,6].forEach(function(d){
    var day=list.filter(function(a){return (a.dias||[]).indexOf(d)>=0}).sort(function(x,y){return toMin(x.ini)-toMin(y.ini)});
    if(!day.length)return;
    out+='<div class="gday"><p class="eyebrow">'+['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][d]+'</p>'+day.map(function(a){
      return '<div class="gclass'+(d===todayDow()?' today':'')+'"><span class="mono gtime">'+a.ini+'–'+a.fim+'</span><span class="grow"><b>'+esc(a.nome)+'</b><small>'+esc(aulaWhere(a))+'</small></span>'+(a.ex?'':'<button class="copy" type="button" data-gdel="'+esc(a.id)+'" aria-label="Remover '+esc(a.nome)+'">Remover</button>')+'</div>';
    }).join('')+'</div>';
  });
  return out||'<p class="muted">Nenhuma aula cadastrada.</p>';
}
function gradeFormHTML(){
  var stops=SORTED.map(function(k){return '<option value="'+k+'">'+STOPS[k].name+'</option>'}).join('');
  return '<form class="gform" id="gform"><div><p class="eyebrow">Adicionar aula</p></div>'+
    '<label class="fld">Disciplina<input type="text" id="gnome" maxlength="50" required placeholder="Ex.: Cálculo I"></label>'+
    '<div class="g2"><label class="fld">Prédio<select id="gbld"><option value="ct">CT</option><option value="ccmn">CCMN</option><option value="outro">Outro (escolher parada)</option></select></label>'+
    '<label class="fld" id="gbwrap">Bloco<select id="gb">'+GBLK.ct.map(function(b){return '<option>'+b+'</option>'}).join('')+'</select></label>'+
    '<label class="fld" id="gstopwrap" hidden>Parada mais perto<select id="gstop">'+stops+'</select></label></div>'+
    '<div class="g2"><label class="fld" id="gfwrap">Andar<select id="gf"><option value="">Pelo número da sala</option><option value="0">Térreo</option>'+[1,2,3,4,5,6,7,8].map(function(n){return '<option value="'+n+'">'+n+'º andar</option>'}).join('')+'</select></label>'+
    '<label class="fld">Sala<input type="text" id="gsala" maxlength="10" placeholder="Ex.: 210"></label></div>'+
    '<fieldset class="gdias"><legend>Dias</legend>'+[1,2,3,4,5,6].map(function(d){return '<label class="gd"><input type="checkbox" value="'+d+'"><span>'+DIAS[d]+'</span></label>'}).join('')+'</fieldset>'+
    '<div class="g2"><label class="fld">Início<input type="time" id="gini" value="08:00" required></label><label class="fld">Fim<input type="time" id="gfim" value="10:00" required></label></div>'+
    '<p class="gerr" id="gerr" role="alert"></p>'+
    '<button class="copy sendrep" type="submit">Salvar aula</button></form>';
}
var gPane,gNext,gWeek;
function renderGrade(focusSel){
  if(!gPane||gPane.hidden)return;
  var now=nowMin();
  gNext.innerHTML='<div><p class="eyebrow">'+(usingExample()?'Exemplo':'Sua semana')+'</p><h2>Minha grade</h2></div>'+
    (usingExample()?'<p class="note">Esta é uma grade de exemplo. Salve sua primeira aula e ela some.</p>':'')+
    gradeNextHTML(now)+'<h3>Semana</h3>'+gradeWeekHTML()+
    '<p class="muted small">'+(SH.on&&SH.uid?'Sua grade fica salva na sua conta e só você vê.':'Sua grade fica salva só neste aparelho.')+'</p>';
  if(!gWeek.dataset.ready){gWeek.innerHTML=gradeFormHTML();gWeek.dataset.ready='1'}
  if(focusSel){var el=gPane.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}

/* ---------- avisar alguém: mensagem pronta com ônibus, horário e chegada ---------- */
var WS={tpl:'saindo',safe:true,open:false,edited:{}};
var WTPL=[['saindo','Estou saindo'],['cheguei','Cheguei'],['atraso','Ônibus atrasou']];
function warnText(c,tpl,safe){
  var from=STOPS[c.from].name,to=STOPS[c.to].name;
  if(tpl==='cheguei')return 'Cheguei bem em '+to+'.';
  if(tpl==='atraso')return 'O circular atrasou. Ainda estou em '+from+' (UFRJ, Fundão) e te aviso quando embarcar.';
  var t='Oi! Vou pegar a Linha '+c.lid+' da UFRJ ('+LINES[c.lid].name+') às '+fmt(c.dep)+' em '+from+', na Ilha do Fundão. Devo chegar em '+to+' por volta de '+fmt(c.arr)+'.';
  return t+(safe?' Se eu não der notícia até '+fmt(c.arr+15)+', me liga. Se eu não atender, avisa a segurança da UFRJ (DISEG): (21) 97380-2554.':' Te aviso quando chegar.');
}
function warnHTML(c,key,open){
  if(!c||!c.lid)return '';
  var txt=WS.edited[key]&&WS.edited[key].tpl===WS.tpl&&WS.edited[key].safe===WS.safe?WS.edited[key].txt:warnText(c,WS.tpl,WS.safe);
  var body='<div class="warn" data-wkey="'+key+'">'+
    '<div class="chips" role="group" aria-label="Tipo de mensagem">'+WTPL.map(function(t){return '<button class="chip" type="button" data-wt="'+t[0]+'" aria-pressed="'+(WS.tpl===t[0])+'">'+t[1]+'</button>'}).join('')+'</div>'+
    (WS.tpl==='saindo'?'<label class="wsafe"><input type="checkbox" id="wsafe-'+key+'" data-wsafe'+(WS.safe?' checked':'')+'> Pedir para me ligarem se eu não der notícia até '+fmt(c.arr+15)+'</label>':'')+
    '<label class="fld">Mensagem (pode editar)<textarea id="wtxt-'+key+'" class="wtxt" rows="5" maxlength="600">'+esc(txt)+'</textarea></label>'+
    '<div class="later"><button class="copy" type="button" data-wcopy="'+key+'">Copiar mensagem</button><a class="copy wa" href="https://wa.me/?text='+encodeURIComponent(txt)+'" target="_blank" rel="noopener" data-wa="'+key+'">Abrir no WhatsApp</a></div>'+
    '<p class="muted small">A página não envia nada sozinha: você escolhe para quem mandar no WhatsApp ou cola em outro app.</p></div>';
  if(open)return '<div class="warnwrap"><h3>Avisar alguém</h3>'+body+'</div>';
  return '<details class="det" id="wdet-'+key+'"'+(WS.open?' open':'')+'><summary>Avisar alguém que estou a caminho</summary>'+body+'</details>';
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-wt],[data-wcopy]');if(!t)return;
  if(t.dataset.wt){WS.tpl=t.dataset.wt;WS.open=true;var w=t.closest('[data-wkey]'),k=w&&w.dataset.wkey;renderAll();var b=document.querySelector('[data-wkey="'+k+'"] [data-wt="'+WS.tpl+'"]');if(b)b.focus({preventScroll:true});return}
  var ta=document.getElementById('wtxt-'+t.dataset.wcopy);if(!ta)return;
  var lab=t.textContent;
  function done(ok){t.textContent=ok?'Copiada':'Selecione e copie';setTimeout(function(){t.textContent=lab},1600)}
  try{navigator.clipboard.writeText(ta.value).then(function(){done(true)},function(){ta.focus();ta.select();done(false)})}catch(err){ta.focus();ta.select();done(false)}
});
document.addEventListener('change',function(e){
  if(e.target.hasAttribute&&e.target.hasAttribute('data-wsafe')){WS.safe=e.target.checked;WS.open=true;var id=e.target.id;renderAll();var el=document.getElementById(id);if(el)el.focus({preventScroll:true})}
});
document.addEventListener('input',function(e){
  if(!e.target.classList||!e.target.classList.contains('wtxt'))return;
  var w=e.target.closest('[data-wkey]'),k=w.dataset.wkey;
  WS.edited[k]={txt:e.target.value,tpl:WS.tpl,safe:WS.safe};
  var a=w.querySelector('[data-wa]');if(a)a.href='https://wa.me/?text='+encodeURIComponent(e.target.value);
});
document.addEventListener('toggle',function(e){if(e.target.id&&e.target.id.indexOf('wdet-')===0)WS.open=e.target.open},true);

/* ---------- calendário acadêmico (graduação 2026; datas iguais nos calendários do IE e da FND/UFRJ) ---------- */
var CAL={
  '2026.1':[
    {a:'2026-02-23',b:'2026-03-02',t:'Inscrição em disciplinas',d:'Pelo Portal do Aluno (SIGA): obrigatórias e eletivas.',k:'prazo'},
    {a:'2026-03-07',t:'Resultado da inscrição (1ª CRID)',d:'Confira e salve o comprovante. Algumas unidades liberam a partir de 05/03.',k:'info'},
    {a:'2026-03-09',t:'Início das aulas',d:'Primeiro dia do período 2026.1.',k:'marco'},
    {a:'2026-03-09',b:'2026-03-23',t:'Inclusão e exclusão de disciplinas',d:'Ajuste da inscrição pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-03-28',t:'Resultado das alterações (2ª CRID)',d:'Algumas unidades liberam a partir de 26/03.',k:'info'},
    {a:'2026-03-30',b:'2026-04-07',t:'Trancamento de disciplinas',d:'Pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-03-09',b:'2026-05-04',t:'Trancamento de matrícula',d:'Pedido feito na coordenação do seu curso.',k:'prazo'},
    {a:'2026-07-18',t:'Fim do período',d:'Último dia do período 2026.1.',k:'marco'}
  ],
  '2026.2':[
    {a:'2026-07-24',b:'2026-08-03',t:'Inscrição em disciplinas',d:'Pelo Portal do Aluno (SIGA): obrigatórias e eletivas.',k:'prazo'},
    {a:'2026-08-08',t:'Resultado da inscrição (1ª CRID)',d:'Confira e salve o comprovante. Algumas unidades liberam a partir de 06/08.',k:'info'},
    {a:'2026-08-10',t:'Início das aulas',d:'Primeiro dia do período 2026.2.',k:'marco'},
    {a:'2026-08-10',b:'2026-08-21',t:'Inclusão e exclusão de disciplinas',d:'Ajuste da inscrição pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-08-29',t:'Resultado das alterações (2ª CRID)',d:'Algumas unidades liberam a partir de 27/08.',k:'info'},
    {a:'2026-08-31',b:'2026-09-10',t:'Trancamento de disciplinas',d:'Pelo Portal do Aluno.',k:'prazo'},
    {a:'2026-08-10',b:'2026-09-28',t:'Trancamento de matrícula',d:'Pedido feito na coordenação do seu curso.',k:'prazo'},
    {a:'2026-12-19',t:'Fim do período',d:'Último dia do período 2026.2.',k:'marco'}
  ]
};
var FERIADOS=[['2026-02-16','Carnaval (segunda)'],['2026-02-17','Carnaval (terça)'],['2026-04-03','Sexta-feira Santa'],['2026-04-21','Tiradentes'],['2026-04-23','São Jorge (feriado no estado do RJ)'],['2026-05-01','Dia do Trabalho'],['2026-06-04','Corpus Christi'],['2026-09-07','Independência'],['2026-10-12','Nossa Senhora Aparecida'],['2026-11-02','Finados'],['2026-11-15','Proclamação da República'],['2026-11-20','Consciência Negra'],['2026-12-25','Natal']];
var PER={'2026.1':['2026-03-09','2026-07-18'],'2026.2':['2026-08-10','2026-12-19']};
var cs={per:null};
function dParse(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function today0(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function dDiff(a,b){return Math.round((a-b)/86400000)}
var MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],SEM=['dom','seg','ter','qua','qui','sex','sáb'];
function dTxt(s){var d=dParse(s);return SEM[d.getDay()]+', '+d.getDate()+' '+MES[d.getMonth()]}
function curPer(){var t=today0(),r=null;Object.keys(PER).forEach(function(k){if(t>=dParse(PER[k][0])&&t<=dParse(PER[k][1]))r=k});if(r)return r;var nxt=Object.keys(PER).filter(function(k){return dParse(PER[k][0])>t})[0];return nxt||'2026.2'}
function evStatus(e){
  var t=today0(),a=dParse(e.a),b=dParse(e.b||e.a);
  if(t>b)return {c:'past',p:'<span class="pill bad">Encerrado</span>'};
  if(t>=a){var left=dDiff(b,t);return {c:'now',p:'<span class="pill good">'+(e.b?(left===0?'Último dia hoje':'Aberto · faltam '+left+' dia'+(left>1?'s':'')):'Hoje')+'</span>'}}
  var n=dDiff(a,t);return {c:'soon',p:'<span class="pill warn">'+(n===1?'Amanhã':'Em '+n+' dias')+'</span>'};
}
function calHTML(){
  var t=today0(),cur=curPer(),per=cs.per||cur,ev=CAL[per];
  var a=dParse(PER[cur][0]),b=dParse(PER[cur][1]),tot=dDiff(b,a),done=Math.max(0,Math.min(tot,dDiff(t,a))),pct=Math.round(done/tot*100);
  var inP=t>=a&&t<=b;
  var head='<div class="next lastbig"><p class="eyebrow">Hoje, '+dTxt(t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'))+'</p>'+
    '<h3 class="plc-t">'+(inP?'Período '+cur+' em andamento':'Próximo período: '+cur)+'</h3>'+
    (inP?'<div class="progress" aria-label="'+pct+'% do período"><i style="width:'+pct+'%"></i></div><p class="small"><b>'+pct+'%</b> do período concluído · faltam <b>'+dDiff(b,t)+' dias</b> para o fim ('+dTxt(PER[cur][1])+').</p>':'<p class="small">As aulas começam em '+dTxt(PER[cur][0])+'.</p>')+'</div>';
  var all=[];Object.keys(CAL).forEach(function(k){CAL[k].forEach(function(e){all.push(e)})});
  var nexts=all.filter(function(e){return dParse(e.b||e.a)>=t}).sort(function(x,y){return dParse(x.a)-dParse(y.a)}).slice(0,4);
  var mm=mudancas(),fer=FERIADOS.filter(function(f){return !mm.some(function(m){return m.de===f[0]})}).map(function(f){return {d:f[0],t:f[1]}});
  mm.forEach(function(m){fer.push({d:m.d,t:m.t,k:m.k,de:m.de,txt:m.txt,src:m.src})});
  fer=fer.filter(function(f){return dParse(f.d)>=t}).sort(function(a,b){return a.d<b.d?-1:1}).slice(0,5);
  var nxt=nexts.length?'<h3>Próximos prazos</h3><div class="cal-list">'+nexts.map(evRow).join('')+'</div>':'<p class="note">Os prazos de 2027 ainda não estão no protótipo. Confira o calendário da Pró-Reitoria de Graduação quando for publicado.</p>';
  return {left:'<div><p class="eyebrow">Graduação UFRJ</p><h2>Calendário acadêmico</h2></div>'+head+nxt+
      '<h3>Próximos feriados</h3>'+(fer.length?'<div class="cal-list">'+fer.map(function(f){var n=dDiff(dParse(f.d),t);return '<div class="cal-ev fer'+(f.de||f.k?' moved':'')+'"><span class="cal-d mono">'+dTxt(f.d)+'</span><span class="grow"><b>'+esc(f.t)+'</b>'+(f.k?'<small>'+esc(MUD_K[f.k]||'')+(f.de?' · transferido de '+dTxt(f.de):'')+'</small>':'')+(f.src?'<small><a href="'+esc(f.src)+'" target="_blank" rel="noopener">Fonte</a></small>':'')+'</span>'+(f.de?'<span class="pill bad">Mudou</span>':'')+'<span class="pill warn">'+(n===0?'Hoje':n===1?'Amanhã':'Em '+n+' dias')+'</span></div>'}).join('')+'</div>':'<p class="muted small">Nenhum feriado até o fim de 2026.</p>')+
      '<p class="muted small">Feriados nacionais e do estado do RJ, mais mudanças de data e pontos facultativos registrados. Quando uma data muda, o aviso aparece no topo da página para todos.</p>'+mudFormHTML(),
    right:'<div><p class="eyebrow">Datas do período</p><h2>Período '+per+'</h2></div>'+
      '<div class="chips" role="group" aria-label="Período">'+Object.keys(CAL).map(function(k){return '<button class="chip" type="button" data-per="'+k+'" aria-pressed="'+(k===per)+'">'+k+'</button>'}).join('')+'</div>'+
      '<div class="cal-list">'+ev.slice().sort(function(x,y){return dParse(x.a)-dParse(y.a)||(x.b?1:0)-(y.b?1:0)}).map(evRow).join('')+'</div>'+
      '<p class="muted small">Datas iguais nos calendários de graduação 2026 publicados pelo Instituto de Economia e pela Faculdade Nacional de Direito. Algumas unidades têm prazos próprios: confirme com a coordenação do seu curso.</p>'};
}
function evRow(e){
  var s=evStatus(e);
  return '<div class="cal-ev '+s.c+' k-'+e.k+'"><span class="cal-d mono">'+dTxt(e.a)+(e.b?' → '+dTxt(e.b):'')+'</span><span class="grow"><b>'+e.t+'</b><small>'+e.d+'</small></span>'+s.p+'</div>';
}
var cPane,cL,cR;
function renderCal(focusSel){
  if(!cPane||cPane.hidden)return;
  var h=calHTML();cL.innerHTML=h.left;cR.innerHTML=h.right;
  if(focusSel){var el=cPane.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}

buildMap();
initZoom();
/* ---------- aba "Lugares" (prédios e horários) ----------
   Horários: Sistema de Alimentação (ru.ufrj.br) e Conexão UFRJ (nov/2025) para os RUs; SiBI/UFRJ para bibliotecas;
   endereços das unidades (PR-4, 2022) para secretarias; Prefeitura Universitária para atendimento e segurança. */
var WK=null;
var PL={
  ru_central:{name:'RU Central',cat:'comida',where:'Restaurante Universitário Edson Luís de Lima Souto, perto da EEFD',p:[446,348],wk:[[420,540],[660,855],[1050,1215]],we:[[720,840],[1050,1155]],note:'Café da manhã R$ 2,00 (seg. a sex.). Único RU aberto nos fins de semana e feriados.'},
  ru_ct1:{name:'RU 01 CT',cat:'comida',where:'Centro de Tecnologia',bld:'ct',p:[855,449],wk:[[420,540],[630,870],[1050,1215]],we:null,note:'Café da manhã R$ 2,00. Fins de semana: só no RU Central.'},
  ru_ct2:{name:'RU 02 CT',cat:'comida',where:'Área do Centro de Tecnologia',wk:[[420,540],[630,870],[1050,1215]],we:null,note:'Café da manhã R$ 2,00. Fins de semana: só no RU Central.'},
  ru_letras:{name:'RU Letras',cat:'comida',where:'Faculdade de Letras',p:[969,392],wk:[[420,540],[630,870],[1050,1215]],we:null,note:'Café da manhã R$ 2,00. Fins de semana: só no RU Central.'},
  b_ct:{s:'Biblioteca Central',name:'Biblioteca Central do CT',cat:'biblio',where:'CT, Bloco B, 2º andar',bld:'ct',b:'B',f:2,p:[855,449],wk:[[420,1140]]},
  b_im:{s:'Biblioteca do IM',name:'Biblioteca do IM (Leopoldo Nachbin)',cat:'biblio',where:'CT, Bloco C, sala 120',bld:'ct',b:'C',f:1,p:[855,449],wk:[[510,1230]]},
  b_iq:{s:'Biblioteca do IQ',name:'Biblioteca do IQ',cat:'biblio',where:'CT, Bloco A, sala 527',bld:'ct',b:'A',f:5,p:[855,449],wk:[[540,1230]]},
  b_if:{s:'Biblioteca do IF',name:'Biblioteca do IF (Plínio Sussekind Rocha)',cat:'biblio',where:'CT, Bloco A, 3º andar, sala 340',bld:'ct',b:'A',f:3,p:[855,449],wk:[[510,1230]]},
  b_eq:{s:'Biblioteca da EQ',name:'Biblioteca da Escola de Química',cat:'biblio',where:'CT, Bloco E, 2º andar, sala E210',bld:'ct',b:'E',f:2,p:[855,449],wk:[[540,1080]]},
  b_ima:{s:'Biblioteca do IMA',name:'Biblioteca do IMA',cat:'biblio',where:'CT, Bloco J, 2º andar',bld:'ct',b:'J',f:2,p:[958,447],wk:[[480,1020]]},
  b_raras:{s:'Obras Raras',name:'Obras Raras do CT',cat:'biblio',where:'CT, Ligação ABC, sala 106',bld:'ct',b:'ABC',f:1,p:[855,449],wk:[[540,990]]},
  b_ccmn:{s:'Biblioteca Central',name:'Biblioteca Central do CCMN',cat:'biblio',where:'CCMN, Bloco A',bld:'ccmn',b:'A',f:null,p:[787,469],wk:[[480,1230]]},
  b_nce:{s:'Biblioteca do NCE',name:'Biblioteca do NCE',cat:'biblio',where:'CCMN, Bloco C',bld:'ccmn',b:'C',f:null,p:[787,469],wk:[[540,1020]]},
  b_ppgg:{s:'Biblioteca PPGG',name:'Biblioteca de Geografia (PPGG)',cat:'biblio',where:'CCMN, Bloco I, sala 14',bld:'ccmn',b:'I',f:0,p:[787,469],wk:[[480,1110]]},
  b_xisto:{name:'Posto de Informação da Xistoquímica',cat:'biblio',where:'Polo de Xistoquímica',p:[1011,536],wk:[[450,930]]},
  a_im:{s:'Secretaria do IM',name:'Secretaria do Instituto de Matemática',cat:'atend',where:'CT, Bloco C, sala 103',bld:'ct',b:'C',f:1,p:[855,449],wk:[[540,1020]]},
  a_iq:{s:'Atendimento do IQ',name:'Atendimento do Instituto de Química',cat:'atend',where:'CT, Bloco A, 6º andar, sala 632',bld:'ct',b:'A',f:6,p:[855,449],wk:[[660,900]]},
  a_if:{s:'Secretaria do IF',name:'Secretaria do Instituto de Física',cat:'atend',where:'CT, Bloco A, 3º andar, sala 342-A',bld:'ct',b:'A',f:3,p:[855,449],wk:null,note:'Horário não informado.'},
  a_geo:{s:'Secretaria de Geografia',name:'Secretaria de Geografia (IGEO)',cat:'atend',where:'CCMN, Bloco G, sala 025',bld:'ccmn',b:'G',f:0,p:[787,469],wk:[[600,1020]]},
  a_ic:{s:'Secretaria do IC',name:'Secretaria do Instituto de Computação',cat:'atend',where:'Prédio do CCMN',bld:'ccmn',b:'?',f:null,p:[787,469],wk:[[540,720]]},
  a_pu:{name:'Prefeitura Universitária',cat:'atend',where:'Prédio da Prefeitura (nº 07 no mapa)',p:[438,456],wk:[[540,960]],note:'Atendimento presencial e telefone fixo (21) 3938-0346.'},
  hall_h:{s:'Hall (eventos)',name:'Hall do Bloco H',cat:'atend',where:'CT, Bloco H',bld:'ct',b:'H',f:1,p:[855,449],wk:null,note:'Espaço de eventos. Sem horário fixo.'},
  s_diseg:{name:'DISEG – Divisão de Segurança',cat:'seg',where:'Telefone (21) 97380-2554',wk:[[0,1440]],we:[[0,1440]],note:'Atendimento 24 horas.'},
  s_cco:{name:'Centro de Controle Operacional',cat:'seg',where:'WhatsApp (21) 99871-1621',wk:[[0,1440]],we:[[0,1440]],note:'Atendimento 24 horas.'}
};
Object.keys(LINES).forEach(function(id){
  var l=LINES[id],d=l.trips[0].deps;
  PL['bus'+id]={incl:1,name:'Linha '+id+' · '+l.name,cat:'onibus',where:'Primeira e última saída da origem',wk:[[d[0],d[d.length-1]+1]],we:l.weekdays?null:undefined,line:id,
    note:l.weekdays?'Só de segunda a sexta.':'Fins de semana: a Prefeitura não informa; confirme antes.'};
});
var BLD={
  ct:{name:'Centro de Tecnologia',short:'CT',addr:'Av. Athos da Silveira Ramos, 149',stop:'ctl',
    blocks:['A','B','C','E','H','J','ABC'],labels:{ABC:'Ligação ABC'},rows:[6,5,4,3,2,1],
    note:'Escola Politécnica: blocos A, C, D, F, G, H e I. Escola de Química: bloco E. O IMA fica no bloco J.'},
  ccmn:{name:'CCMN',short:'CCMN',addr:'Av. Athos da Silveira Ramos, 274',stop:'ccmn',
    blocks:['A','C','G','I','?'],labels:{'?':'Bloco não informado'},rows:[0,null],
    note:'Matemática, Física e Química são do CCMN, mas ficam no prédio do CT (veja a aba CT).'}
};
var CATS=[['todos','Todos'],['aberto','Abertos agora'],['comida','Alimentação'],['biblio','Bibliotecas'],['atend','Atendimento'],['seg','Segurança'],['onibus','Ônibus']];
var pstate={bld:'ct',pl:'b_ct',cat:'todos',q:''};
function hm(m){m=Math.round(m);if(m>=1440)m=1439;var h=Math.floor(m/60),x=m%60;return h+'h'+(x?String(x).padStart(2,'0'):'')}
function rangesOf(it,we){if(we){if(it.we===undefined)return 'unk';return it.we}return it.wk}
function rangesTxt(r,incl){if(r==='unk')return 'Não informado';if(!r)return 'Fechado';if(r.length===1&&r[0][0]===0&&r[0][1]>=1440)return '24 horas';return r.map(function(x){return hm(x[0])+'–'+hm(x[1]-(incl?1:0))}).join(' · ')}
function statusOf(it,now){
  if(it.fechadoTemp)return {c:'bad',t:'Fechado temporariamente'};
  var mh=mudHoje();if(mh&&(it.cat==='biblio'||it.cat==='atend'||it.cat==='comida'))return {c:'warn',t:(MUD_K[mh.k]||'Mudança')+' hoje · confirme'};
  var we=isWeekend()&&!state.manual,r=rangesOf(it,we);
  if(r==='unk')return {c:'warn',t:'Confirmar no fim de semana'};
  if(!r)return {c:'bad',t:it.wk===null&&!we?'Sem horário fixo':'Fechado hoje'};
  for(var i=0;i<r.length;i++){
    if(now>=r[i][0]&&now<r[i][1]){
      if(r[i][1]>=1440&&r[i][0]===0)return {c:'good',t:'Aberto 24h'};
      var left=r[i][1]-now;
      return left<=30?{c:'warn',t:(it.incl?'Última em ':'Fecha em ')+left+' min'}:{c:'good',t:(it.incl?'Até ':'Aberto até ')+hm(r[i][1]-(it.incl?1:0))};
    }
  }
  for(var j=0;j<r.length;j++)if(r[j][0]>now)return {c:'bad',t:'Fechado · abre '+hm(r[j][0])};
  return {c:'bad',t:'Fechado'};
}
function pill(s){return '<span class="pill '+s.c+'">'+s.t+'</span>'}
function placeCard(id,now,bare){
  var it=PL[id];if(!it)return '';
  var we=isWeekend()&&!state.manual;
  return '<div class="plcard"><div class="plc-h"><div><p class="eyebrow">'+({comida:'Alimentação',biblio:'Biblioteca',atend:'Atendimento',seg:'Segurança',onibus:'Ônibus',aula:'Sua aula'})[it.cat]+'</p><h3 class="plc-t">'+it.name+'</h3></div>'+pill(statusOf(it,now))+'</div>'+
    '<dl class="kv"><dt>Onde</dt><dd>'+it.where+'</dd><dt>Seg. a sex.</dt><dd class="mono">'+rangesTxt(it.wk,it.incl)+'</dd><dt>Fim de semana</dt><dd class="mono">'+rangesTxt(it.we===undefined?'unk':it.we)+'</dd></dl>'+
    (it.note?'<p class="muted small">'+it.note+'</p>':'')+
    (bare?'':'<div class="later">'+(it.p&&!it.bld?'<button class="copy" type="button" data-showmap="'+id+'">Ver no mapa</button>':'')+(it.line?'<button class="copy" type="button" data-showline="'+it.line+'">Ver itinerário</button>':'')+'</div>')+'</div>';
}
function floorName(f){return f===null?'Andar não informado':f===0?'Térreo · salas 0xx':f+'º andar'}
function buildingHTML(now){
  var B=BLD[pstate.bld],items=Object.keys(PL).filter(function(k){return PL[k].bld===pstate.bld&&PL[k].b});
  var rows=B.rows.slice();items.forEach(function(k){var f=PL[k].f;if(f!==null&&rows.indexOf(f)<0)rows.push(f)});rows=rows.filter(function(f){return f!==null}).sort(function(a,b){return b-a});
  if(items.some(function(k){return PL[k].f===null}))rows.push(null);
  var blocks=B.blocks.slice();items.forEach(function(k){if(blocks.indexOf(PL[k].b)<0)blocks.push(PL[k].b)});
  blocks.sort(function(a,b){var o=function(x){return x==='?'?99:x==='ABC'?50:x.charCodeAt(0)};return o(a)-o(b)});
  B={name:B.name,short:B.short,addr:B.addr,labels:B.labels,note:B.note,blocks:blocks};
  var cols=B.blocks.length;
  var g='<div class="fgrid" style="--cols:'+cols+'" role="grid" aria-label="Esquema por blocos e andares do '+B.short+'">';
  g+='<div class="fh"></div>'+B.blocks.map(function(b){return '<div class="fh blk">'+(B.labels[b]||'Bloco '+b)+'</div>'}).join('');
  rows.forEach(function(f){
    g+='<div class="fl">'+floorName(f)+'</div>';
    B.blocks.forEach(function(b){
      var here=items.filter(function(k){return PL[k].b===b&&PL[k].f===f});
      g+='<div class="cell'+(here.length?' has':'')+'">'+here.map(function(k){
        var s=PL[k].cat==='aula'?{c:'aula'}:statusOf(PL[k],now);
        return '<button type="button" class="pin '+s.c+(pstate.pl===k?' on':'')+'" data-pl="'+k+'" title="'+PL[k].name+'"><i></i><span>'+(PL[k].s||PL[k].name)+'</span></button>';
      }).join('')+'</div>';
    });
  });
  g+='</div>';
  var sel=PL[pstate.pl]?pstate.pl:items[0];pstate.pl=sel;
  return '<div><p class="eyebrow">Mapa interno · esquema por blocos e andares</p><h2>Prédios por dentro</h2></div>'+
    '<div class="chips" role="group" aria-label="Escolha o prédio">'+Object.keys(BLD).map(function(k){return '<button class="chip" type="button" data-bld="'+k+'" aria-pressed="'+(k===pstate.bld)+'">'+BLD[k].short+'</button>'}).join('')+'</div>'+
    '<p class="small"><b>'+B.name+'</b> · <span class="mono muted">'+B.addr+'</span></p>'+
    '<div class="fwrap">'+g+'</div>'+
    '<div class="flegend"><span><i class="pin-dot good"></i>Aberto</span><span><i class="pin-dot warn"></i>Fecha logo / sem horário</span><span><i class="pin-dot bad"></i>Fechado</span></div>'+
    placeCard(sel,now)+planHTML(sel)+
    '<p class="muted small">'+B.note+' Esquema montado com as localizações oficiais (bloco, andar e sala); não é a planta arquitetônica. Quando a fonte só dá a sala, o andar sai do número (sala 527 → 5º andar).</p>';
}
function hoursHTML(now){
  var q=pstate.q.trim().toLowerCase();
  var list=Object.keys(PL).filter(function(k){
    var it=PL[k];if(it.cat==='aula')return false;
    if(pstate.cat==='aberto'){var s=statusOf(it,now);if(s.c==='bad'||/Confirmar|Sem horário/.test(s.t))return false}
    else if(pstate.cat!=='todos'&&it.cat!==pstate.cat)return false;
    if(q&&(it.name+' '+it.where).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  var ordem={comida:0,biblio:1,atend:2,seg:3,onibus:4};
  list.sort(function(a,b){return ordem[PL[a].cat]-ordem[PL[b].cat]});
  return '<div><p class="eyebrow">Hoje, '+(isWeekend()&&!state.manual?'fim de semana':'dia útil')+' · '+fmt(now)+'</p><h2>Horários de funcionamento</h2></div>'+
    '<div class="chips" role="group" aria-label="Filtrar">'+CATS.map(function(c){return '<button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(pstate.cat===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'+
    '<label class="fld">Buscar local<input type="search" id="hq" placeholder="Ex.: biblioteca, RU, Bloco A" value="'+pstate.q.replace(/"/g,'&quot;')+'"></label>'+
    '<div class="hlist">'+(list.length?list.map(function(k){
      var it=PL[k],s=statusOf(it,now),we=isWeekend()&&!state.manual;
      return '<button class="hrow" type="button" data-pl="'+k+'"><span class="grow"><b>'+it.name+'</b><small>'+it.where+'</small></span><span class="htime mono">'+(it.wk===null?'Sem horário':rangesTxt(rangesOf(it,we),it.incl))+'</span>'+pill(s)+(RUS.indexOf(k)>=0&&filaOf(k)?filaPill(k):'')+'</button>';
    }).join(''):'<p class="muted">Nenhum local encontrado com esse filtro.</p>')+'</div>'+
    '<p class="muted small">Horários de dias úteis informados pela UFRJ; nas férias e nos feriados podem mudar.</p>';
}
/* ---------- planta do andar (ilustrativa: a posição sai do número da sala) ---------- */
function roomOf(it){var m=/sala\s+([A-Z]?)(\d{2,3})(-[A-Z])?/i.exec(it.where||'');if(!m)return null;var num=parseInt(m[2],10);return {label:(m[1]||'')+m[2]+(m[3]||''),n:num%100||1}}
function floorShort(f){return f===null?'Andar ?':f===0?'Térreo':f+'º andar'}
function planSVG(bk,blk,f,selId){
  var items=Object.keys(PL).filter(function(k){var x=PL[k];return x.bld===bk&&x.b===blk&&x.f===f});
  var rooms=[],areas=[];
  items.forEach(function(k){var r=roomOf(PL[k]);if(r)rooms.push({k:k,r:r});else areas.push(k)});
  var maxn=rooms.reduce(function(m,x){return Math.max(m,x.r.n)},0);
  var N=Math.max(20,maxn+(maxn%2?3:2));if(N%2)N++;
  var per=N/2,RW=46,X0=24,CORE=110,WC=96,TOP=40,DEP=96,COR=54;
  var W=X0+CORE+per*RW+WC+24,H=TOP+DEP+COR+DEP+24;
  var yC=TOP+DEP,yB=yC+COR,xR=X0+CORE,xW=xR+per*RW;
  var s='<svg class="plan" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Planta ilustrativa do '+(BLD[bk].labels[blk]||'Bloco '+blk)+', '+floorShort(f)+'">';
  // contorno e corredor
  s+='<rect class="pl-floor" x="'+X0+'" y="'+TOP+'" width="'+(W-X0-24)+'" height="'+(DEP*2+COR)+'" rx="6"/>';
  s+='<rect class="pl-cor" x="'+(X0+CORE)+'" y="'+yC+'" width="'+(per*RW+WC-10)+'" height="'+COR+'"/>';
  s+='<text class="pl-cap" x="'+(xR+per*RW/2)+'" y="'+(yC+COR/2)+'">corredor</text>';
  // núcleo: escada, elevador, hall
  s+='<rect class="pl-room core" x="'+X0+'" y="'+TOP+'" width="'+CORE+'" height="'+DEP+'"/>';
  for(var i=0;i<8;i++)s+='<line class="pl-step" x1="'+(X0+10)+'" y1="'+(TOP+12+i*10)+'" x2="'+(X0+CORE-10)+'" y2="'+(TOP+12+i*10)+'"/>';
  s+='<text class="pl-lb" x="'+(X0+CORE/2)+'" y="'+(TOP+DEP-12)+'">Escada</text>';
  s+='<rect class="pl-room core" x="'+X0+'" y="'+yB+'" width="'+CORE+'" height="'+DEP+'"/>';
  s+='<rect class="pl-lift" x="'+(X0+28)+'" y="'+(yB+18)+'" width="'+(CORE-56)+'" height="'+(DEP-46)+'" rx="3"/><path class="pl-x" d="M'+(X0+28)+','+(yB+18)+' l'+(CORE-56)+','+(DEP-46)+' M'+(X0+28+CORE-56)+','+(yB+18)+' l-'+(CORE-56)+','+(DEP-46)+'"/>';
  s+='<text class="pl-lb" x="'+(X0+CORE/2)+'" y="'+(yB+DEP-12)+'">Elevador</text>';
  s+='<rect class="pl-hall" x="'+(X0)+'" y="'+yC+'" width="'+CORE+'" height="'+COR+'"/>';
  s+='<text class="pl-cap" x="'+(X0+CORE/2)+'" y="'+(yC+COR/2)+'">'+(f===0||f===1?'Entrada':'Hall')+'</text>';
  if(f===0||f===1)s+='<path class="pl-door" d="M'+(X0-2)+','+(yC+COR/2)+' l-16,-9 v18z"/>';
  // banheiros
  s+='<rect class="pl-room wc" x="'+xW+'" y="'+TOP+'" width="'+(WC-10)+'" height="'+DEP+'"/><text class="pl-lb" x="'+(xW+(WC-10)/2)+'" y="'+(TOP+DEP/2)+'">WC Fem.</text>';
  s+='<rect class="pl-room wc" x="'+xW+'" y="'+yB+'" width="'+(WC-10)+'" height="'+DEP+'"/><text class="pl-lb" x="'+(xW+(WC-10)/2)+'" y="'+(yB+DEP/2)+'">WC Masc.</text>';
  // salas: ímpares em cima, pares embaixo
  var taken={};rooms.forEach(function(x){taken[x.r.n]=x});
  var areaSpan=areas.length?{from:Math.max(1,Math.floor(per/2)-2),len:5}:null;
  var callout=null;
  for(var n=1;n<=N;n++){
    var idx=Math.ceil(n/2)-1,top=n%2===1,x=xR+idx*RW,y=top?TOP:yB;
    if(areaSpan&&top&&idx>=areaSpan.from&&idx<areaSpan.from+areaSpan.len)continue;
    var t=taken[n],cls='pl-room'+(t?(t.k===selId?' sel':' hit'):'');
    s+='<rect class="'+cls+'" x="'+x+'" y="'+y+'" width="'+RW+'" height="'+DEP+'"/>';
    var lbl=t?t.r.label:((f===null?'':String(f===0?'0':f))+String(n).padStart(2,'0'));
    s+='<text class="pl-num'+(t?' on':'')+'" x="'+(x+RW/2)+'" y="'+(top?y+DEP-14:y+16)+'">'+lbl+'</text>';
    s+='<line class="pl-dooro" x1="'+(x+12)+'" y1="'+(top?yC:yB)+'" x2="'+(x+30)+'" y2="'+(top?yC:yB)+'"/>';
    if(t&&(t.k===selId||!callout))callout={x:x+RW/2,y:top?y+DEP/2-6:y+DEP/2+6,k:t.k,top:top};
  }
  if(areaSpan){
    var ax=xR+areaSpan.from*RW,aw=areaSpan.len*RW,sel=areas.indexOf(selId)>=0;
    s+='<rect class="pl-room '+(sel?'sel':'hit')+'" x="'+ax+'" y="'+TOP+'" width="'+aw+'" height="'+DEP+'"/>';
    s+='<text class="pl-num on" x="'+(ax+aw/2)+'" y="'+(TOP+DEP-14)+'">'+areas.map(function(k){return PL[k].s||PL[k].name}).join(' · ')+'</text>';
    s+='<line class="pl-dooro" x1="'+(ax+aw/2-14)+'" y1="'+yC+'" x2="'+(ax+aw/2+14)+'" y2="'+yC+'"/>';
    if(sel||!callout)callout={x:ax+aw/2,y:TOP+DEP/2-6,k:sel?selId:areas[0],top:true};
  }
  if(callout){
    s+='<g class="pl-pin" transform="translate('+callout.x+','+callout.y+')"><path d="M0,0 c-9,-10 -14,-16 -14,-23 a14,14 0 1 1 28,0 c0,7 -5,13 -14,23z"/><circle cy="-23" r="5"/></g>';
    var nm=PL[callout.k].s||PL[callout.k].name,tw=nm.length*7.2+20,tx=Math.min(W-tw/2-6,Math.max(tw/2+6,callout.x));
    s+='<g class="pl-tag"><rect x="'+(tx-tw/2)+'" y="6" width="'+tw+'" height="24" rx="12"/><text x="'+tx+'" y="18">'+nm+'</text></g>';
  }
  return s+'</svg>';
}
function planHTML(id){
  var bk=pstate.bld,B=BLD[bk],it=PL[id]&&PL[id].bld===bk?PL[id]:null;
  var blocks=bk==='ct'?['A','B','C','D','E','F','G','H','I','J','ABC']:['A','B','C','D','E','F','G','H','I'];
  var inB=function(b){return Object.keys(PL).filter(function(k){return PL[k].bld===bk&&PL[k].b===b})};
  var eb=pstate.eb;if(!eb||blocks.indexOf(eb)<0)eb=it&&blocks.indexOf(it.b)>=0?it.b:'A';pstate.eb=eb;
  var here=inB(eb),fl=bk==='ct'?[0,1,2,3,4,5,6]:[0,1,2,3];
  here.forEach(function(k){var f=PL[k].f;if(f!==null&&fl.indexOf(f)<0)fl.push(f)});
  fl.sort(function(a,b){return a-b});
  if(here.some(function(k){return PL[k].f===null}))fl.push(null);
  var ef=pstate.ef;
  if(ef===undefined||fl.indexOf(ef)<0){ef=it&&it.b===eb?it.f:(here.length?PL[here[0]].f:1);if(fl.indexOf(ef)<0)ef=1}
  pstate.ef=ef;
  var blkName=B.labels[eb]||'Bloco '+eb,onFloor=here.filter(function(k){return PL[k].f===ef}),selOn=it&&it.b===eb&&it.f===ef;
  var how;
  if(selOn){var r=roomOf(it);how=ef===null?'O andar não é informado; procure a recepção do '+blkName+'.':
    (ef<=1?'Fica no '+(ef===0?'térreo':'1º andar')+' do '+blkName+'.':'Do hall do '+blkName+', suba pela escada ou elevador até o '+ef+'º andar.')+(r?' Siga o corredor até a sala '+r.label+'.':'')}
  else if(onFloor.length)how='Toque num local deste andar para ver onde ele fica.';
  else how='Nenhum local cadastrado neste andar. A planta mostra a distribuição típica de salas do '+blkName+'.';
  var bchips=blocks.map(function(b){var n=inB(b).length;return '<button class="chip" type="button" data-eb="'+b+'" aria-pressed="'+(b===eb)+'">'+(b==='ABC'?'Ligação ABC':b)+(n?'<span class="cnt" aria-label="'+n+' locais"></span>':'')+'</button>'}).join('');
  var fchips=fl.map(function(f){var n=here.filter(function(k){return PL[k].f===f}).length;return '<button class="chip" type="button" data-ef="'+(f===null?'n':f)+'" aria-pressed="'+(f===ef)+'">'+floorShort(f)+(n?'<span class="cnt" aria-label="'+n+' locais"></span>':'')+'</button>'}).join('');
  return '<div class="planbox" id="planbox"><div class="plc-h"><div><p class="eyebrow">'+B.short+' · '+blkName+' · '+floorShort(ef)+'</p><h3 class="plc-t">'+(selOn?esc(it.name):'Escolha o bloco e o andar')+'</h3></div>'+(selOn?pill(statusOf(it,nowMin())):'')+'</div>'+
    (it&&it.b==='?'?'<p class="note">A UFRJ não informa em que bloco fica '+esc(it.name)+'. Escolha um bloco abaixo para explorar.</p>':'')+
    '<div class="pick"><span class="pick-l">Bloco</span><div class="chips" role="group" aria-label="Bloco">'+bchips+'</div></div>'+
    '<div class="pick"><span class="pick-l">Andar</span><div class="chips" role="group" aria-label="Andar">'+fchips+'</div></div>'+
    '<div class="planwrap">'+planSVG(bk,eb,ef,selOn?id:null)+'</div>'+
    '<p class="small">'+how+'</p>'+
    (onFloor.length?'<div class="chips lgfloor" role="group" aria-label="Locais neste andar">'+onFloor.map(function(k){return '<button class="chip" type="button" data-pl="'+k+'" aria-pressed="'+(k===id)+'"><i class="pin-dot '+statusOf(PL[k],nowMin()).c+'"></i>'+esc(PL[k].s||PL[k].name)+'</button>'}).join('')+'</div>':'')+
    '<div class="flegend"><span><i class="pl-key sel"></i>Local escolhido</span><span><i class="pl-key hit"></i>Outros locais deste andar</span><span><i class="pl-key core"></i>Escada e elevador</span><span><i class="cnt"></i>Bloco ou andar com locais cadastrados</span></div>'+
    '</div>';
}

var pPane=$('#pane-predios'),pB=$('#pBuild'),pH=$('#pHours');
function renderPredios(focusSel){
  if(pPane.hidden)return;
  var now=nowMin();
  pB.innerHTML=buildingHTML(now);pH.innerHTML=hoursHTML(now);
  var pw=pPane.querySelector('.planwrap'),pin=pw&&pw.querySelector('.pl-pin');
  if(pin){var a=pin.getBoundingClientRect(),b=pw.getBoundingClientRect();pw.scrollLeft+=a.left+a.width/2-(b.left+b.width/2)}
  if(focusSel){var el=pPane.querySelector(focusSel);if(el){el.focus({preventScroll:true});if(el.id==='hq'){var v=el.value;el.setSelectionRange(v.length,v.length)}}}
}
function setTab(t){
  if(t==='cfg'){openCfg();return}
  if(['trajeto','predios','grade','cal'].indexOf(t)<0)t='trajeto';
  var pr=t==='predios';
  $('#pane-trajeto').hidden=t!=='trajeto';pPane.hidden=!pr;$('#pane-grade').hidden=t!=='grade';$('#pane-cal').hidden=t!=='cal';if(t==='cal')renderCal();
  if(t==='grade')renderGrade();
  document.querySelectorAll('[data-tab]').forEach(function(b){if(b.id==='tab-cfg')return;var on=b.dataset.tab===t;b.setAttribute('aria-selected',String(on));b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});
  if(pr)renderPredios();
}
document.querySelectorAll('[data-tab]').forEach(function(b){
  b.addEventListener('click',function(){var t=b.dataset.tab;if(t==='cfg'){if($('#pane-cfg').hidden)openCfg();else closeCfg();return}setTab(t);try{history.replaceState(null,'','#'+t)}catch(e){location.hash=t}});
  b.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();var T=['trajeto','predios','grade','cal'],i=T.indexOf(b.dataset.tab);if(i<0)return;var o=T[(i+(e.key==='ArrowRight'?1:3))%4];setTab(o);try{history.replaceState(null,'','#'+o)}catch(err){}$('[data-tab="'+o+'"]').focus()}});
});
window.addEventListener('hashchange',function(){setTab(location.hash.slice(1))});
pPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-eb],[data-ef],[data-pf],[data-bld],[data-pl],[data-cat],[data-showmap],[data-showline]');if(!t)return;
  if(t.dataset.eb){pstate.eb=t.dataset.eb;pstate.ef=undefined;renderPredios('[data-eb="'+t.dataset.eb+'"]');return}
  if(t.dataset.ef!==undefined){pstate.ef=t.dataset.ef==='n'?null:+t.dataset.ef;renderPredios('[data-ef="'+t.dataset.ef+'"]');return}
  if(t.dataset.pf!==undefined){pstate.pf=t.dataset.pf==='n'?null:+t.dataset.pf;renderPredios('[data-pf="'+t.dataset.pf+'"]');return}
  if(t.dataset.bld){pstate.bld=t.dataset.bld;pstate.pl=null;pstate.pf=undefined;pstate.eb=undefined;pstate.ef=undefined;renderPredios('[data-bld="'+t.dataset.bld+'"]');return}
  if(t.dataset.cat){pstate.cat=t.dataset.cat;renderPredios('[data-cat="'+t.dataset.cat+'"]');return}
  if(t.dataset.showmap){var it=PL[t.dataset.showmap];state.sel={kind:'place',id:t.dataset.showmap};renderAll();ensureVisible(it.p);document.querySelector('.mapcard').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});return}
  if(t.dataset.showline){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}select('line',t.dataset.showline,true);return}
  if(t.dataset.pl){
    var k=t.dataset.pl;pstate.pl=k;pstate.pf=undefined;if(PL[k].bld&&PL[k].b!=='?'){pstate.eb=PL[k].b;pstate.ef=PL[k].f}else{pstate.eb=undefined;pstate.ef=undefined}
    if(PL[k].bld)pstate.bld=PL[k].bld;
    renderPredios(t.classList.contains('pin')?'[data-pl="'+k+'"].pin':null);
    if(t.classList.contains('hrow')){var c=pPane.querySelector('#planbox')||pPane.querySelector('.plcard');if(c){c.scrollIntoView({behavior:'auto',block:'nearest'});var f=c.querySelector('button');if(f)f.focus({preventScroll:true})}}
  }
});
pPane.addEventListener('input',function(e){if(e.target.id==='hq'){pstate.q=e.target.value;pH.innerHTML=hoursHTML(nowMin());var el=$('#hq');el.focus();el.setSelectionRange(el.value.length,el.value.length)}});

/* ---------- eventos: serviços, avisos e grade ---------- */
gPane=$('#pane-grade');gNext=$('#gNext');gWeek=$('#gWeek');
syncAulas();
var svcbar=$('#svcbar');
function renderSvcBar(){
  svcbar.hidden=!state.layers.svc;
  svcbar.innerHTML=SVC_G.map(function(g){return '<button class="chip" type="button" data-sg="'+g[0]+'" aria-pressed="'+(state.svcGrp===g[0])+'">'+g[1]+'</button>'}).join('');
}
$('#chSvc').addEventListener('click',function(){setLayer('svc',this);renderSvcBar();schedule()});
svcbar.addEventListener('click',function(e){var b=e.target.closest('[data-sg]');if(!b)return;state.svcGrp=b.dataset.sg;renderSvcBar();updateMap();schedule();var f=svcbar.querySelector('[data-sg="'+state.svcGrp+'"]');if(f)f.focus()});
function scrollToMap(){document.querySelector('.mapcard').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'})}
detail.addEventListener('click',function(e){
  var g=e.target.closest('[data-repgo]');
  if(g){var pl=placeOf(g.dataset.repgo);if(pl){if(pl.kind==='svc'&&!state.layers.svc){state.layers.svc=true;$('#chSvc').setAttribute('aria-pressed','true');renderSvcBar()}select(pl.kind,pl.id,false);ensureVisible(pl.p);scrollToMap()}return}
  var d=e.target.closest('[data-repdel]');
  if(d){removeReport(d.dataset.repdel);return}
});
detail.addEventListener('submit',function(e){
  if(e.target.id!=='repform')return;
  e.preventDefault();
  var k=$('#repk').value,pl=$('#repp').value,t=$('#rept').value.trim(),btn=e.target.querySelector('.sendrep');
  btn.disabled=true;btn.textContent='Publicando…';
  sendReport(k,pl,t).then(function(ok){
    if(ok){renderDetail();var det=$('#repdet');if(det)det.open=false}
    else{btn.disabled=false;btn.textContent='Publicar aviso'}
  });
});
gPane.addEventListener('change',function(e){
  if(e.target.id==='gfrom'){gs.from=e.target.value;renderGrade('#gfrom');return}
  if(e.target.id==='gbld'){
    var v=e.target.value,out=v==='outro';
    $('#gbwrap').hidden=out;$('#gfwrap').hidden=out;$('#gstopwrap').hidden=!out;
    if(!out)$('#gb').innerHTML=GBLK[v].map(function(b){return '<option>'+b+'</option>'}).join('');
  }
});
gPane.addEventListener('submit',function(e){
  if(e.target.id!=='gform')return;
  e.preventDefault();
  var nome=$('#gnome').value.trim(),bld=$('#gbld').value,dias=[].slice.call(gPane.querySelectorAll('.gdias input:checked')).map(function(i){return +i.value});
  var ini=$('#gini').value,fim=$('#gfim').value,err=$('#gerr');
  if(!nome){err.className='gerr';err.textContent='Escreva o nome da disciplina.';$('#gnome').focus();return}
  if(!dias.length){err.textContent='Marque pelo menos um dia.';gPane.querySelector('.gdias input').focus();return}
  if(!ini||!fim||toMin(fim)<=toMin(ini)){err.textContent='O fim da aula precisa ser depois do início.';$('#gfim').focus();return}
  err.textContent='';err.className='gerr';
  var a={id:'a'+Date.now().toString(36),nome:nome.slice(0,50),bld:bld,b:bld==='outro'?'':$('#gb').value,stop:bld==='outro'?$('#gstop').value:'',sala:$('#gsala').value.trim().slice(0,10),andar:bld==='outro'||$('#gf').value===''?null:+$('#gf').value,dias:dias,ini:ini,fim:fim};
  if(!GRADE)GRADE=[];
  GRADE.push(a);saveGrade();syncAulas();
  e.target.reset();$('#gini').value='08:00';$('#gfim').value='10:00';$('#gbwrap').hidden=false;$('#gfwrap').hidden=false;$('#gstopwrap').hidden=true;
  $('#gb').innerHTML=GBLK.ct.map(function(b){return '<option>'+b+'</option>'}).join('');
  err.textContent='Aula salva.';err.className='gerr ok';
  renderGrade();
});
gPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-gdel],[data-gplan],[data-gmap]');if(!t)return;
  if(t.dataset.gdel){GRADE=(GRADE||[]).filter(function(a){return a.id!==t.dataset.gdel});saveGrade();syncAulas();renderGrade();return}
  var a=gradeList().filter(function(x){return x.id===(t.dataset.gplan||t.dataset.gmap)})[0];if(!a)return;
  if(t.dataset.gplan){pstate.bld=a.bld;pstate.pl='aula_'+a.id;pstate.pf=undefined;pstate.eb=a.b;pstate.ef=PL['aula_'+a.id]?PL['aula_'+a.id].f:undefined;setTab('predios');try{history.replaceState(null,'','#predios')}catch(err){}
    var pb=$('#planbox');if(pb)pb.scrollIntoView({behavior:'auto',block:'start'});return}
  if(t.dataset.gmap){select('stop',aulaStop(a),false);scrollToMap()}
});
renderSvcBar();
drawShared();
initShared();
/* ---------- mudanças de data (feriados transferidos, pontos facultativos, suspensões) ----------
   Base conhecida + mudanças publicadas no armazenamento compartilhado (coleção "cal"), que só o dono edita.
   A página não consegue consultar sites sozinha; uma mudança nova entra pelo formulário do dono ou pelo Claude. */
var MUD_BASE=[
  {id:'servidor-2026',d:'2026-10-30',de:'2026-10-28',t:'Dia do Servidor Público',k:'facultativo',
   txt:'Ponto facultativo transferido de quarta (28/10) para sexta (30/10) pelo Ministério da Gestão (MGI), para órgãos federais como a UFRJ. Atendimentos administrativos e bibliotecas podem não funcionar; confirme as aulas com o professor.',
   src:'https://agenciabrasil.ebc.com.br/geral/noticia/2026-10/dia-do-servidor-publico-ponto-facultativo-sera-na-sexta-feira'}
];
var MUD_DB=[];
var MUD_K={feriado:'Feriado',facultativo:'Ponto facultativo',suspensao:'Aulas suspensas'};
function mudancas(){
  var byId={};MUD_BASE.concat(MUD_DB).forEach(function(m){if(m&&m.d&&/^\d{4}-\d{2}-\d{2}$/.test(m.d))byId[m.id||m.d]=m});
  return Object.keys(byId).map(function(k){return byId[k]}).sort(function(a,b){return a.d<b.d?-1:1});
}
function isoToday(){var t=today0();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')}
function mudHoje(){if(state.manual)return null;var s=isoToday();return mudancas().filter(function(m){return m.d===s})[0]||null}
function movedFrom(iso){return mudancas().filter(function(m){return m.de===iso})[0]||null}
var MUDMIN={};try{MUDMIN=JSON.parse(localStorage.getItem('cse-mud-min'))||{}}catch(e){MUDMIN={}}
function saveMudMin(){try{localStorage.setItem('cse-mud-min',JSON.stringify(MUDMIN))}catch(e){}}
function bannerHTML(){
  var t=today0(),up=mudancas().filter(function(m){var n=dDiff(dParse(m.d),t);return n>=0&&n<=7||(m.de&&dDiff(dParse(m.de),t)===0)});
  if(!up.length)return '';
  return up.map(function(m){
    var id=esc(m.id||m.d),n=dDiff(dParse(m.d),t),quando=n===0?'Hoje':n===1?'Amanhã':dTxt(m.d).replace(/^./,function(c){return c.toUpperCase()});
    var deHoje=m.de&&dDiff(dParse(m.de),t)===0;
    if(MUDMIN[m.id||m.d])return '<button class="mudpill" type="button" data-mudopen="'+id+'" aria-label="Mostrar aviso: '+esc(m.t)+'"><span class="mud-k">'+esc(MUD_K[m.k]||'Mudança')+'</span>'+esc(m.t)+' · '+dTxt(m.d)+'<span aria-hidden="true" class="mud-chev">▾</span></button>';
    return '<div class="mud"><span class="mud-k">'+esc(MUD_K[m.k]||'Mudança')+'</span><span class="grow"><b>'+(deHoje?'Hoje é dia normal: o '+esc(m.t)+' foi para '+dTxt(m.d)+'.':quando+': '+esc(m.t)+(m.de?' (transferido de '+dTxt(m.de)+')':''))+'</b><small>'+esc(m.txt||'')+'</small></span><button class="copy" type="button" data-tab-go="cal">Ver no calendário</button><button class="mudmin" type="button" data-mudmin="'+id+'" aria-label="Minimizar aviso" title="Minimizar">–</button></div>';
  }).join('');
}
function drawBanner(){var b=$('#mudbar');if(b){var h=CFG.banner?bannerHTML():'';b.innerHTML=h;b.hidden=!h}}
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-mudmin],[data-mudopen]');if(!a)return;
  var id=a.dataset.mudmin||a.dataset.mudopen;
  if(a.dataset.mudmin)MUDMIN[id]=1;else delete MUDMIN[id];
  saveMudMin();drawBanner();
  var f=document.querySelector(a.dataset.mudmin?'[data-mudopen="'+id+'"]':'[data-mudmin="'+id+'"]');if(f)f.focus({preventScroll:true});
});
/* formulário do dono */
var MUD_OWNER=false,mudBusy=false;
function mudFormHTML(){
  if(!MUD_OWNER)return '';
  return '<details class="det"><summary>Registrar mudança de data (só você vê)</summary><form class="repform" id="mudform">'+
    '<label class="fld">Nome<input type="text" id="mudt" maxlength="60" required placeholder="Ex.: Dia do Servidor Público"></label>'+
    '<div class="g2"><label class="fld">Tipo<select id="mudk"><option value="facultativo">Ponto facultativo</option><option value="feriado">Feriado</option><option value="suspensao">Aulas suspensas</option></select></label>'+
    '<label class="fld">Nova data<input type="date" id="mudd" required></label></div>'+
    '<label class="fld">Data original, se foi transferido (opcional)<input type="date" id="mudde"></label>'+
    '<label class="fld">Detalhe e fonte (opcional)<input type="text" id="mudx" maxlength="240" placeholder="Ex.: Portaria da Reitoria nº…"></label>'+
    '<p class="gerr" id="muderr" role="alert"></p><button class="copy sendrep" type="submit">Publicar para todos</button></form></details>'+
    (MUD_DB.length?'<div class="cal-list">'+MUD_DB.map(function(m){return '<div class="cal-ev"><span class="cal-d mono">'+dTxt(m.d)+'</span><span class="grow"><b>'+esc(m.t)+'</b></span><button class="copy" type="button" data-muddel="'+esc(m.id)+'">Remover</button></div>'}).join('')+'</div>':'');
}

/* ---------- ajustes (salvos neste aparelho) ---------- */
function saveCfg(){try{localStorage.setItem('cse-cfg',JSON.stringify(CFG))}catch(e){}}
var COVERS=[['folha','Folha inferior','O mapa nítido com uma folha de vidro embaixo.'],['cartao','Cartão central','Cartão de vidro no meio, sobre o mapa desfocado.'],['titulo','Título gigante','Nome grande e barra de ícones.'],['none','Sem capa','Abre direto no mapa.']];
function applyCoverStyle(){var c=$('#cover');if(c){c.dataset.style=CFG.cover==='none'?'folha':CFG.cover;if(!c.hidden&&typeof placeCoverMap==='function')placeCoverMap()}}
function cvMini(k){
  if(k==='none')return '<span class="cm cm-none"><span class="cm-map"></span><span class="cm-chip"></span><span class="cm-chip s"></span></span>';
  return '<span class="cm cm-'+k+'"><span class="cm-map"></span><span class="cm-glass"><i></i><i></i><i class="b"></i></span></span>';
}
function tg(id,on,label,desc){return '<label class="tgl" for="'+id+'"><span class="grow"><b>'+label+'</b><small>'+desc+'</small></span><input type="checkbox" role="switch" id="'+id+'"'+(on?' checked':'')+'><span class="sw2" aria-hidden="true"></span></label>'}
var BGS=[['brilho','Brilho','#FF9F5A','#79AEFF','#4CD38D'],['aurora','Aurora','#4CD38D','#A895FF','#4FD1DE'],['sol','Pôr do sol','#FF7A59','#F27BBE','#FFC15A'],['oceano','Oceano','#3D8BFF','#4FD1DE','#2B5BD7'],['mapa','Mapa do campus','',''],['liso','Liso','','','']];
function applyBg(){
  document.documentElement.style.setProperty('--bgmap-sw','url('+MAPMINI+')');
  var r=document.documentElement;r.dataset.bg=CFG.bg||'brilho';
  if(CFG.bg==='mapa')r.style.setProperty('--bgmap','url('+MAPBLUR+')');
}
function bgSwatch(b){
  if(b[0]==='mapa')return '<span class="bgsw bgsw-mapa"></span>';
  if(b[0]==='liso')return '<span class="bgsw bgsw-liso"></span>';
  return '<span class="bgsw" style="background:radial-gradient(70% 70% at 15% 15%,'+b[2]+'aa,transparent 70%),radial-gradient(70% 70% at 90% 30%,'+b[3]+'99,transparent 70%),radial-gradient(80% 70% at 50% 110%,'+b[4]+'88,transparent 70%),var(--surface)"></span>';
}
function renderCfg(focusSel){
  var L=$('#cfgL'),Rr=$('#cfgR');if(!L)return;
  var cur=COVERS.filter(function(c){return c[0]===CFG.cover})[0]||COVERS[0];
  var wasOpen=!!(document.getElementById('cvdet')&&document.getElementById('cvdet').open),bgOpen=!!(document.getElementById('bgdet')&&document.getElementById('bgdet').open);
  var curBg=BGS.filter(function(b){return b[0]===(CFG.bg||'brilho')})[0]||BGS[0];
  L.innerHTML='<div><p class="eyebrow">Ajustes</p><h2>Aparência</h2></div>'+
    '<details class="cvdet" id="bgdet"'+(bgOpen?' open':'')+'><summary><span class="cvsum">'+bgSwatch(curBg)+'</span><span class="grow"><b>Plano de fundo</b><small>'+curBg[1]+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="bgopts" role="radiogroup" aria-label="Plano de fundo">'+BGS.map(function(b){var on=(CFG.bg||'brilho')===b[0];
      return '<button type="button" class="bgopt" role="radio" aria-checked="'+on+'" data-bg="'+b[0]+'">'+bgSwatch(b)+'<span>'+b[1]+'</span></button>'}).join('')+'</div></details>'+
    '<details class="cvdet" id="cvdet"'+(wasOpen?' open':'')+'><summary><span class="cvsum">'+cvMini(cur[0])+'</span><span class="grow"><b>Capa</b><small>'+cur[1]+'</small></span><span class="chev" aria-hidden="true">▾</span></summary>'+
    '<div class="cvopts" role="radiogroup" aria-label="Estilo da capa">'+COVERS.map(function(c){var on=CFG.cover===c[0];
      return '<button type="button" class="cvopt" role="radio" aria-checked="'+on+'" data-cover="'+c[0]+'">'+cvMini(c[0])+'<span class="cvo-t"><b>'+c[1]+'</b><small>'+c[2]+'</small></span></button>'}).join('')+'</div>'+
    '<button class="copy" type="button" id="cfgPreview"'+(CFG.cover==='none'?' disabled':'')+'>Ver a capa agora</button></details>';
  Rr.innerHTML='<div><p class="eyebrow">Ajustes</p><h2>Mapa</h2></div>'+
    '<div class="tgls">'+tg('cfgFlow',CFG.flow,'Movimento nas rotas','A linha se desenha do início ao fim, no sentido do ônibus. Desligue para a linha ficar parada.')+'</div>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Avisos e notificações</h2></div>'+
    '<div class="tgls">'+
    tg('cfgBanner',CFG.banner,'Mudanças de data acima do mapa','Feriados transferidos, pontos facultativos e aulas suspensas.')+
    tg('cfgReps',CFG.reps,'Avisos dos alunos','Fila, ônibus atrasado e Wi-Fi fora do ar, no mapa e no painel.')+
    tg('cfgCoverToday',CFG.coverToday,'Aviso do dia na capa','A etiqueta amarela com o que muda hoje ou amanhã.')+
    '</div>'+
    '<div><p class="eyebrow">Ajustes</p><h2>Perfil</h2></div>'+
    (PERFIL?'<div class="prof"><span class="lg-face" aria-hidden="true">'+esc(PERFIL.name.charAt(0).toUpperCase())+'</span><span class="grow"><b>'+esc(PERFIL.name)+'</b><small>'+(PERFIL.pin?'Com código de 4 dígitos':'Sem código')+'</small></span><button class="copy" type="button" id="cfgLogout">Sair</button></div>':'<p class="muted small keep">Nenhum perfil salvo neste aparelho.</p>')+
    '<div class="tgls">'+tg('cfgLogin',CFG.login,'Tela de entrada ao abrir','Mostra o perfil salvo e o Face ID antes da capa.')+'</div>'+
    '<p class="muted small keep">Os ajustes ficam salvos neste aparelho.</p>';
  if(focusSel){var el=document.querySelector(focusSel);if(el)el.focus({preventScroll:true})}
}
document.addEventListener('click',function(e){var b=e.target.closest('[data-bg]');if(!b||!b.classList.contains('bgopt'))return;CFG.bg=b.dataset.bg;saveCfg();applyBg();renderCfg('.bgopt[data-bg="'+CFG.bg+'"]');var d=document.getElementById('bgdet');if(d)d.open=true});
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-cover]');
  if(b){CFG.cover=b.dataset.cover;saveCfg();applyCoverStyle();renderCfg('[data-cover="'+CFG.cover+'"]');var dt=document.getElementById('cvdet');if(dt)dt.open=true;return}
  if(e.target.closest('#cfgPreview')){cfgM.hidden=true;$('#tab-cfg').setAttribute('aria-pressed','false');openCover()}
});
document.addEventListener('change',function(e){
  var id=e.target.id,map={cfgBanner:'banner',cfgReps:'reps',cfgCoverToday:'coverToday',cfgLogin:'login',cfgFlow:'flow'};
  if(!map[id])return;CFG[map[id]]=e.target.checked;saveCfg();updateMap();drawBanner();drawShared();renderDetail();coverToday();
});

cPane=$('#pane-cal');cL=$('#cL');cR=$('#cR');
document.addEventListener('click',function(e){var g=e.target.closest('[data-tab-go]');if(!g)return;setTab(g.dataset.tabGo);try{history.replaceState(null,'','#'+g.dataset.tabGo)}catch(err){}var c=$('#pane-cal');if(c)c.scrollIntoView({behavior:'auto',block:'start'})});
cPane.addEventListener('submit',function(e){
  if(e.target.id!=='mudform')return;e.preventDefault();
  var t=$('#mudt').value.trim(),d=$('#mudd').value,de=$('#mudde').value,err=$('#muderr');
  if(!t||!d){err.className='gerr';err.textContent='Preencha o nome e a nova data.';return}
  if(!SH.on||mudBusy){err.className='gerr';err.textContent='O armazenamento compartilhado não está disponível agora.';return}
  mudBusy=true;var x=$('#mudx').value.trim();
  SH.db.doc('cal/m'+Date.now().toString(36)).set({t:t,d:d,de:de,k:$('#mudk').value,txt:x}).then(function(){mudBusy=false;err.className='gerr ok';err.textContent='Publicado. Todos já veem o aviso.'},function(){mudBusy=false;err.className='gerr';err.textContent='Não deu para publicar. Só o dono da página pode registrar mudanças.'});
});
cPane.addEventListener('click',function(e){var x=e.target.closest('[data-muddel]');if(x&&SH.on){SH.db.doc('cal/'+x.dataset.muddel).delete().catch(function(){});return}
  var b=e.target.closest('[data-per]');if(!b)return;cs.per=b.dataset.per;renderCal('[data-per="'+cs.per+'"]')});

/* ---------- ajustes em tela cheia ---------- */
var cfgM=$('#pane-cfg'),cfgPrevFocus=null;
function openCfg(){
  cfgPrevFocus=document.activeElement;renderCfg();cfgM.hidden=false;cfgM.classList.remove('closing');
  document.documentElement.style.overflow='hidden';$('#tab-cfg').setAttribute('aria-pressed','true');
  cfgM.querySelector('.cfgsheet').scrollTop=0;setTimeout(function(){$('#cfgClose').focus({preventScroll:true})},30);
}
function closeCfg(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;cfgM.classList.add('closing');
  setTimeout(function(){cfgM.hidden=true;if(cover.hidden&&login.hidden)document.documentElement.style.overflow='';$('#tab-cfg').setAttribute('aria-pressed','false');var g=$('#tab-cfg');if(g)g.focus({preventScroll:true})},rm?0:220);
}
$('#cfgClose').addEventListener('click',closeCfg);
cfgM.addEventListener('click',function(e){if(e.target===cfgM)closeCfg()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cfgM.hidden&&cover.hidden&&login.hidden)closeCfg()});

/* ---------- glossário de siglas ---------- */
var GL_CATS=[['todas','Todas'],['lugar','Prédios e unidades'],['serv','Órgãos e serviços'],['acad','Vida acadêmica'],['net','Internet e sistemas']];
/* [sigla, nome por extenso, explicação, categoria, atalho] atalho: 's:<parada>' mapa · 'b:<prédio>' Lugares · 'c:<categoria>' Lugares */
var GLOSS=[
 ['UFRJ','Universidade Federal do Rio de Janeiro','A Cidade Universitária, na Ilha do Fundão, é o maior campus da UFRJ.','lugar',''],
 ['CT','Centro de Tecnologia','Engenharias (Escola Politécnica), Escola de Química e parte do Instituto de Química. Tem dois RUs.','lugar','b:ct'],
 ['CCMN','Centro de Ciências Matemáticas e da Natureza','Matemática, Física, Química, Geociências e Computação. Fica ao lado do CT.','lugar','b:ccmn'],
 ['CCS','Centro de Ciências da Saúde','O prédio grande ao lado do HU, com os cursos da saúde e da biologia.','lugar','s:ccsbb'],
 ['HU','Hospital Universitário Clementino Fraga Filho','Hospital da UFRJ, colado no CCS. Tem ponto das linhas internas na porta.','lugar','s:hu'],
 ['IPPMG','Instituto de Puericultura e Pediatria Martagão Gesteira','Hospital pediátrico da UFRJ, perto do HU.','lugar',''],
 ['EEFD','Escola de Educação Física e Desportos','Educação Física e Dança, com quadras, piscina e pista.','lugar','s:eefd'],
 ['IF','Instituto de Física','Parte fica no CCMN e parte no prédio novo da Av. Athos da Silveira Ramos.','lugar','s:ifn'],
 ['IM','Instituto de Matemática','Fica no CCMN, bloco C. A biblioteca é a Leopoldo Nachbin.','lugar','b:ccmn'],
 ['IQ','Instituto de Química','Aulas e biblioteca no CT, bloco A.','lugar','b:ct'],
 ['IC','Instituto de Computação','Fica no CCMN, com secretaria e laboratórios.','lugar','b:ccmn'],
 ['IGEO','Instituto de Geociências','Geografia, Geologia e Meteorologia, no CCMN.','lugar','b:ccmn'],
 ['PPGG','Programa de Pós-Graduação em Geografia','Dá nome à biblioteca de Geografia, no CCMN, bloco I.','lugar','b:ccmn'],
 ['NCE','Núcleo de Computação Eletrônica','Hoje se chama Instituto Tércio Pacitti, mas todo mundo ainda diz NCE. Fica no CCMN, bloco C.','lugar','b:ccmn'],
 ['EQ','Escola de Química','Fica no CT. A biblioteca atende Química e Engenharia Química.','lugar','b:ct'],
 ['EBA','Escola de Belas Artes','Fica no prédio da Reitoria (Jorge Machado Moreira).','lugar','s:reit'],
 ['FAU','Faculdade de Arquitetura e Urbanismo','Divide o prédio da Reitoria com a EBA.','lugar','s:reit'],
 ['IMA','Instituto de Macromoléculas Professora Eloisa Mano','Pesquisa em polímeros, entre o CT e a Reitoria.','lugar',''],
 ['COPPEAD','Instituto de Pós-Graduação e Pesquisa em Administração','Fim da linha 2 das linhas internas.','lugar','s:coppead'],
 ['RU','Restaurante Universitário','O “bandejão”. Há o RU Central, dois no CT e um em Letras.','lugar','c:comida'],
 ['IE','Instituto de Economia','Fica no campus da Praia Vermelha. Aqui aparece como fonte do calendário.','lugar',''],
 ['FND','Faculdade Nacional de Direito','Fica no centro do Rio. Aqui aparece como fonte do calendário.','lugar',''],
 ['CETEM','Centro de Tecnologia Mineral','Instituto federal de pesquisa (não é da UFRJ) com ponto das linhas internas.','lugar','s:cetem'],
 ['CEPEL','Centro de Pesquisas de Energia Elétrica','Centro de pesquisa da Eletrobras na ilha.','lugar','s:cepel'],
 ['CENPES','Centro de Pesquisas Leopoldo Américo Miguez de Mello','Centro de pesquisa da Petrobras. Há dois pontos: Cenpes I e II.','lugar','s:cenpes1'],
 ['CEPE','Clube dos Empregados da Petrobras','Clube na Av. Horácio Macedo, com ponto das linhas internas.','lugar','s:cepe'],
 ['IEN','Instituto de Engenharia Nuclear','Instituto da CNEN (não é da UFRJ), perto da Xistoquímica.','lugar',''],
 ['DISEG','Divisão de Segurança','Segurança e vigilância do campus. Cuida das guaritas e das câmeras.','serv','c:seg'],
 ['CCO','Centro de Controle Operacional','Central da Prefeitura que acompanha o trânsito e as câmeras da ilha.','serv','c:seg'],
 ['DFO','Divisão da Frota Oficial','Setor da Prefeitura Universitária que cuida dos veículos. Dá nome ao ponto CPST / DFO.','serv','s:cpst'],
 ['DIPRO','Divisão de Produção','Setor da Prefeitura Universitária. Dá nome a um ponto das linhas internas.','serv','s:dipro'],
 ['CPST','Coordenação de Políticas de Saúde do Trabalhador','Saúde dos servidores da UFRJ, ligada à PR-4.','serv','s:cpst'],
 ['PR-4','Pró-Reitoria de Pessoal','Cuida dos servidores. Publica a lista de endereços das unidades.','serv',''],
 ['SiBI','Sistema de Bibliotecas e Informação','Rede das bibliotecas da UFRJ. Os horários das bibliotecas vêm de lá.','serv','c:biblio'],
 ['TIC','Superintendência de Tecnologia da Informação e Comunicação','A TI da UFRJ. Cuida da Intranet e do eduroam.','serv',''],
 ['BRT','Bus Rapid Transit','Ônibus expresso em corredor exclusivo. A Estação de Integração liga o BRT às linhas internas.','serv','s:est'],
 ['MGI','Ministério da Gestão e da Inovação em Serviços Públicos','Define pontos facultativos e trocas de feriado para órgãos federais, como a UFRJ.','serv',''],
 ['SIGA','Sistema Integrado de Gestão Acadêmica','O Portal do Aluno: inscrição em disciplinas, notas e boletim.','acad',''],
 ['CRID','Confirmação de Registro de Inscrição em Disciplinas','O comprovante de que você ficou inscrito. Salve uma cópia a cada período.','acad',''],
 ['CR','Coeficiente de Rendimento','A média ponderada das suas notas no período.','acad',''],
 ['CRA','Coeficiente de Rendimento Acumulado','A média de todo o curso até agora. Pesa em bolsas e estágios.','acad',''],
 ['CA','Centro Acadêmico','Representação dos alunos de um curso. Bom lugar para tirar dúvidas de calouro.','acad',''],
 ['DCE','Diretório Central dos Estudantes Mário Prata','Representação de todos os alunos da UFRJ.','acad',''],
 ['eduroam','education roaming','Wi-Fi das universidades. Com o login da UFRJ, conecta aqui e em instituições do mundo todo.','net',''],
 ['RNP','Rede Nacional de Ensino e Pesquisa','Rede que liga as universidades brasileiras e opera o eduroam no país.','net',''],
 ['CPF','Cadastro de Pessoas Físicas','Seu login na Intranet UFRJ, junto com a senha.','net','']
];
var gl={cat:'todas',q:''},glM=$('#glossM'),glPrev=null;
function glFold(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function glEsc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function glGo(a){
  if(!a)return '';
  var k=a.slice(0,1),v=a.slice(2);
  if(k==='s'&&STOPS[v])return '<button type="button" class="chip gl-go" data-glgo="'+a+'">Ver no mapa</button>';
  if(k==='b'||k==='c')return '<button type="button" class="chip gl-go" data-glgo="'+a+'">Ver em Lugares</button>';
  return '';
}
function renderGloss(){
  var q=glFold(gl.q.trim());
  var list=GLOSS.filter(function(g){
    if(gl.cat!=='todas'&&g[3]!==gl.cat)return false;
    if(!q)return true;
    return glFold(g[0]).indexOf(q)>=0||glFold(g[1]).indexOf(q)>=0||glFold(g[2]).indexOf(q)>=0;
  }).sort(function(a,b){
    if(q){var ea=glFold(a[0])===q?0:glFold(a[0]).indexOf(q)===0?1:2,eb=glFold(b[0])===q?0:glFold(b[0]).indexOf(q)===0?1:2;if(ea!==eb)return ea-eb}
    return a[0].localeCompare(b[0],'pt',{sensitivity:'base'});
  });
  $('#glCats').innerHTML=GL_CATS.map(function(c){return '<button type="button" class="chip" data-glcat="'+c[0]+'" aria-pressed="'+(gl.cat===c[0])+'">'+c[1]+'</button>'}).join('');
  $('#glSub').textContent=GLOSS.length+' siglas usadas no app e no dia a dia da UFRJ';
  $('#glList').innerHTML=list.length?list.map(function(g){
    return '<article class="gl-item"><h3 class="gl-s" lang="pt-BR">'+glEsc(g[0])+'</h3><p class="gl-n">'+glEsc(g[1])+'</p><p class="gl-d muted">'+glEsc(g[2])+'</p>'+glGo(g[4])+'</article>';
  }).join(''):'<p class="gl-empty muted">Nenhuma sigla encontrada para “'+glEsc(gl.q.trim())+'”.</p>';
}
function openGloss(q){
  glPrev=document.activeElement;if(typeof q==='string'){gl.q=q;gl.cat='todas'}
  if(!cfgM.hidden)cfgM.hidden=true,$('#tab-cfg').setAttribute('aria-pressed','false');
  renderGloss();$('#glQ').value=gl.q;glM.hidden=false;glM.classList.remove('closing');
  document.documentElement.style.overflow='hidden';$('#glossBtn').setAttribute('aria-pressed','true');
  glM.querySelector('.cfgsheet').scrollTop=0;
  setTimeout(function(){var f=window.matchMedia('(pointer:fine)').matches?$('#glQ'):$('#glClose');f.focus({preventScroll:true})},30);
}
function closeGloss(after){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;glM.classList.add('closing');
  setTimeout(function(){glM.hidden=true;document.documentElement.style.overflow='';$('#glossBtn').setAttribute('aria-pressed','false');
    if(after)after();else{var g=$('#glossBtn');if(g)g.focus({preventScroll:true})}},rm?0:220);
}
$('#glossBtn').addEventListener('click',function(){if(glM.hidden)openGloss();else closeGloss()});
$('#glClose').addEventListener('click',function(){closeGloss()});
glM.addEventListener('click',function(e){
  if(e.target===glM){closeGloss();return}
  var c=e.target.closest('[data-glcat]');if(c){gl.cat=c.dataset.glcat;renderGloss();var f=glM.querySelector('[data-glcat="'+gl.cat+'"]');if(f)f.focus();return}
  var g=e.target.closest('[data-glgo]');if(!g)return;
  var a=g.dataset.glgo,k=a.slice(0,1),v=a.slice(2);
  closeGloss(function(){
    if(k==='s'){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}select('stop',v,false);scrollToMap()}
    else{if(k==='b'){pstate.bld=v;pstate.pl=null;pstate.pf=undefined}else{pstate.cat=v;pstate.q=''}
      setTab('predios');try{history.replaceState(null,'','#predios')}catch(err){}
      var el=k==='b'?$('#planbox'):$('#pHours');if(el)el.scrollIntoView({behavior:'auto',block:'start'})}
  });
});
$('#glQ').addEventListener('input',function(e){gl.q=e.target.value;renderGloss()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!glM.hidden){e.stopPropagation();closeGloss()}},true);


/* ======================= gestão: dados que o gestor pode alterar ======================= */
var GST={linhas:{},pontos:{},wifi:{},servicos:{},plantas:{items:[]},bloqueados:{ids:[]},respostas:{}};
var GKEYS=['linhas','pontos','wifi','servicos','plantas','bloqueados','respostas'];
var GESTOR=false; /* true: editor no claude.ai · 'demo': fora do claude.ai (salva só neste aparelho) */
var GLS='cse-gestao-';
var ORIG={lines:{},stops:{},wifi:{},pl:{}};
Object.keys(LINES).forEach(function(id){ORIG.lines[id]={sum:LINES[id].sum,deps:LINES[id].trips.map(function(t){return t.deps.slice()})}});
Object.keys(STOPS).forEach(function(id){ORIG.stops[id]={name:STOPS[id].name,short:STOPS[id].short,p:STOPS[id].p.slice()}});
Object.keys(WIFI).forEach(function(id){ORIG.wifi[id]=JSON.parse(JSON.stringify(WIFI[id]))});
Object.keys(PL).forEach(function(k){ORIG.pl[k]={wk:PL[k].wk,we:PL[k].we,note:PL[k].note}});
function cleanTxt(s,n){return String(s==null?'':s).replace(/[<>]/g,'').trim().slice(0,n||120)}
function validP(p){return Array.isArray(p)&&p.length===2&&isFinite(p[0])&&isFinite(p[1])&&p[0]>=60&&p[0]<=1440&&p[1]>=0&&p[1]<=620}
function hhmm(t){var m=/^\s*(\d{1,2})(?::|h)?(\d{2})?\s*$/.exec(t);if(!m)return NaN;var h=+m[1],mi=+(m[2]||0);if(h>24||mi>59)return NaN;return h*60+mi}
/* "05:00-19:00/10, 19:30-23:30/30, 23:50" → minutos */
function parseDeps(str){
  var out=[];String(str||'').split(/[,;\n]+/).forEach(function(tok){
    tok=tok.trim();if(!tok)return;
    var m=/^(.+?)\s*[-–a]\s*(.+?)\s*\/\s*(\d+)$/.exec(tok);
    if(m){var a=hhmm(m[1]),b=hhmm(m[2]),s=+m[3];if(isNaN(a)||isNaN(b)||s<1||b<a)throw new Error('Trecho inválido: '+tok);for(var t=a;t<=b;t+=s)out.push(t);return}
    var x=hhmm(tok);if(isNaN(x))throw new Error('Horário inválido: '+tok);out.push(x);
  });
  out=out.filter(function(v,i,a){return a.indexOf(v)===i}).sort(function(a,b){return a-b});
  if(out.length>400)throw new Error('Saídas demais (máximo 400).');
  return out;
}
function compressDeps(d){
  var parts=[],i=0;
  while(i<d.length){
    var j=i+1,s=d[i+1]-d[i];
    if(j<d.length){while(j+1<d.length&&d[j+1]-d[j]===s)j++}
    if(j<d.length&&j-i>=2){parts.push(fmt(d[i])+'-'+fmt(d[j])+'/'+s);i=j+1}
    else{parts.push(fmt(d[i]));i++}
  }
  return parts.join(', ');
}
/* "07:00-10:00, 11:00-14:00" | "24h" → [[420,600],[660,840]] */
function parseRanges(str){
  str=String(str||'').trim();if(!str)return null;
  if(/^24\s*h/i.test(str))return [[0,1440]];
  return str.split(/[,;·]+/).map(function(tok){
    var m=/^\s*(.+?)\s*[-–]\s*(.+?)\s*$/.exec(tok);if(!m)throw new Error('Use o formato 07:00-10:00');
    var a=hhmm(m[1]),b=hhmm(m[2]);if(isNaN(a)||isNaN(b)||b<=a)throw new Error('Intervalo inválido: '+tok.trim());return [a,b];
  });
}
function rangesStr(r){if(r===undefined)return '';if(!r)return 'fechado';if(r.length===1&&r[0][0]===0&&r[0][1]>=1440)return '24h';return r.map(function(x){return fmt(x[0])+'-'+fmt(Math.min(x[1],1439))}).join(', ')}
/* geometria das linhas depende da posição das paradas */
function applyG(){
  Object.keys(ORIG.pl).forEach(function(k){if(!PL[k])return;var o=ORIG.pl[k],g=(GST.servicos||{})[k]||{};
    try{PL[k].wk=g.wk!=null&&g.wk!==''?parseRanges(g.wk):o.wk}catch(e){PL[k].wk=o.wk}
    try{PL[k].we=g.we==='fechado'?null:(g.we!=null&&g.we!==''?parseRanges(g.we):o.we)}catch(e){PL[k].we=o.we}
    PL[k].note=g.note?cleanTxt(g.note,200):o.note;PL[k].fechadoTemp=!!g.fechado;
  });
  Object.keys(LINES).forEach(function(id){var o=ORIG.lines[id],g=(GST.linhas||{})[id]||{},l=LINES[id];
    l.sum=g.sum?cleanTxt(g.sum,200):o.sum;l.susp=!!g.susp;l.aviso=cleanTxt(g.aviso,200);
    l.trips.forEach(function(tr,i){var d=null;try{d=g.hor&&g.hor[i]?parseDeps(g.hor[i]):null}catch(e){}tr.deps=d&&d.length?d:o.deps[i].slice()});
    var d0=l.trips[0].deps;if(PL['bus'+id])PL['bus'+id].wk=[[d0[0],d0[d0.length-1]+1]];
  });
  Object.keys(STOPS).forEach(function(id){var o=ORIG.stops[id],g=(GST.pontos||{})[id]||{},s=STOPS[id];
    s.name=g.name?cleanTxt(g.name,60):o.name;s.short=g.short?cleanTxt(g.short,24):o.short;s.p=validP(g.p)?g.p.slice():o.p.slice();s.off=!!g.off;s.aviso=cleanTxt(g.aviso,200);
  });
  Object.keys(WIFI).forEach(function(id){if(!ORIG.wifi[id])delete WIFI[id]});
  Object.keys(ORIG.wifi).forEach(function(id){WIFI[id]=JSON.parse(JSON.stringify(ORIG.wifi[id]))});
  var gw=GST.wifi||{};Object.keys(gw).forEach(function(id){var g=gw[id];if(!g||!/^[\w-]{1,40}$/.test(id))return;
    if(g.removed){delete WIFI[id];return}
    var base=WIFI[id]||{avg:3,votes:0,note:''};
    base.name=g.name?cleanTxt(g.name,60):base.name;base.note=g.note!=null?cleanTxt(g.note,160):base.note;
    if(validP(g.p))base.p=g.p.slice();base.ssid=cleanTxt(g.ssid,40);base.acesso=cleanTxt(g.acesso,60);base.novo=!ORIG.wifi[id];
    if(base.name&&validP(base.p))WIFI[id]=base;
  });
  geom();
}
function rebuildAll(){
  applyG();
  if(state.sel&&state.sel.kind==='wifi'&&!WIFI[state.sel.id])state.sel=null;
  buildMap();updateMap();drawShared();applyView(true);renderPlan();refreshAll();
  if(!pPane.hidden)renderPredios();
  if(gestM&&!gestM.hidden)renderGest();
}
function loadLocalG(){GKEYS.forEach(function(k){try{var v=JSON.parse(localStorage.getItem(GLS+k));if(v)GST[k]=v}catch(e){}})}
function saveG(key,val){
  GST[key]=val;rebuildAll();
  if(GESTOR===true&&SH.on){
    return SH.db.doc('gestao/'+key).set({v:val,ts:Date.now(),by:SH.uid||''}).then(function(){gToast('Salvo. Já vale para todos.');return true},function(){gToast('Não deu para salvar. Confira se você tem acesso de editor.',1);return false});
  }
  try{localStorage.setItem(GLS+key,JSON.stringify(val))}catch(e){gToast('Sem espaço para salvar neste aparelho.',1);return Promise.resolve(false)}
  gToast('Salvo neste aparelho (modo demonstração).');return Promise.resolve(true);
}
function blocked(uid){return !!(uid&&GST.bloqueados&&Array.isArray(GST.bloqueados.ids)&&GST.bloqueados.ids.indexOf(uid)>=0)}
function canPost(){if(!SH.on)return true;return !SH.denied&&SH.write!==false&&!!SH.uid&&!blocked(SH.uid)}

/* ======================= fila do RU (os alunos informam) ======================= */
var RUS=['ru_central','ru_ct1','ru_ct2','ru_letras'].filter(function(k){return PL[k]});
var FILA_N=[['Sem fila','na hora','good','0'],['Pequena','até 5 min','good','5'],['Média','5 a 15 min','warn','15'],['Grande','15 a 30 min','bad','30'],['Enorme','mais de 30 min','bad','30+']];
var FILA_TTL=45*60000,FKEY='cse-fila-local';
SH.fila=[];
var filaLocal=[];try{filaLocal=JSON.parse(localStorage.getItem(FKEY))||[]}catch(e){}
var filaOpen=null,filaBusy=false,filaMsg='';
function flatFila(docs){
  var out=[];docs.forEach(function(d){var it=(d.data()||{}).items;if(!Array.isArray(it))return;it.slice(0,8).forEach(function(r){
    if(!r||!PL[r.ru]||RUS.indexOf(r.ru)<0)return;var n=Math.round(+r.n);if(!(n>=0&&n<=4))return;
    out.push({id:String(r.id||''),ru:String(r.ru),n:n,ts:+r.ts||0,mine:d.id===SH.uid,owner:d.id})})});
  return out.sort(function(a,b){return b.ts-a.ts});
}
function filaAll(){
  var now=Date.now(),l=SH.on?SH.fila:filaLocal.map(function(r){return {id:r.id,ru:r.ru,n:r.n,ts:r.ts,mine:true,owner:''}});
  return l.filter(function(r){return r.ts>now-FILA_TTL&&r.ts<now+5*60000&&!blocked(r.owner)});
}
function filaOf(ru){
  var l=filaAll().filter(function(r){return r.ru===ru});if(!l.length)return null;
  var now=Date.now(),sw=0,s=0;l.forEach(function(r){var w=Math.pow(.5,(now-r.ts)/(15*60000));sw+=w;s+=w*r.n});
  return {n:Math.max(0,Math.min(4,Math.round(s/sw))),count:l.length,last:Math.max.apply(null,l.map(function(r){return r.ts}))};
}
function filaPill(ru){
  var f=filaOf(ru);if(!f)return '<span class="pill">Sem informação</span>';
  var L=FILA_N[f.n];return '<span class="pill '+L[2]+'">'+(f.n?'Fila '+L[0].toLowerCase():'Sem fila')+' · '+L[1]+'</span>';
}
function filaRow(k,now){
  var it=PL[k],f=filaOf(k),st=statusOf(it,now),open=filaOpen===k,ok=canPost();
  return '<div class="fila-r'+(open?' open':'')+'"><div class="fila-top"><span class="grow"><b>'+esc(it.name)+'</b><small>'+(f?f.count+(f.count>1?' avisos':' aviso')+' · último '+agoTxt(f.last):esc(st.t))+'</small></span>'+filaPill(k)+
    (ok?'<button type="button" class="copy" data-filaopen="'+k+'" aria-expanded="'+open+'">'+(open?'Cancelar':'Informar')+'</button>':'')+'</div>'+
    (open?'<div class="fila-pick" role="group" aria-label="Tamanho da fila no '+esc(it.name)+'">'+FILA_N.map(function(L,i){return '<button type="button" class="fila-b '+L[2]+'" data-fila="'+k+'" data-n="'+i+'"><b>'+L[0]+'</b><small>'+L[1]+'</small></button>'}).join('')+'</div>':'')+
  '</div>';
}
function filaHTML(){
  var now=nowMin(),why='';
  if(SH.on&&blocked(SH.uid))why='Sua conta não pode informar filas no momento (decisão da gestão).';
  else if(SH.on&&(SH.denied||SH.write===false))why='Você pode ver as filas. Para informar, o dono da página precisa te dar acesso de colaborador.';
  return '<div class="filabox" id="filabox"><div class="plc-h"><div><p class="eyebrow">Ao vivo · últimos 45 min</p><h3 class="plc-t">Fila do RU agora</h3></div>'+(SH.on?'<span class="pill good">Compartilhado</span>':'<span class="pill warn">Só neste aparelho</span>')+'</div>'+
    '<div class="fila-l">'+RUS.map(function(k){return filaRow(k,now)}).join('')+'</div>'+
    (filaMsg?'<p class="small fila-ok" role="status">'+esc(filaMsg)+'</p>':'')+
    '<p class="muted small">'+(why||'Está na fila? Toque em Informar e escolha o tamanho. Seu nome não aparece, e os avisos mais recentes pesam mais.')+'</p></div>';
}
function sendFila(ru,n){
  var now=Date.now(),it={id:'f'+now.toString(36),ru:ru,n:n,ts:now};
  if(!SH.on){
    filaLocal=filaLocal.filter(function(r){return r.ts>now-FILA_TTL&&!(r.ru===ru&&r.ts>now-5*60000)});filaLocal.unshift(it);filaLocal=filaLocal.slice(0,8);
    try{localStorage.setItem(FKEY,JSON.stringify(filaLocal))}catch(e){}
    return Promise.resolve(true);
  }
  if(filaBusy||!canPost())return Promise.resolve(false);
  filaBusy=true;
  var mineL=SH.fila.filter(function(r){return r.mine&&r.ts>now-FILA_TTL&&!(r.ru===ru&&r.ts>now-5*60000)}).map(function(r){return {id:r.id,ru:r.ru,n:r.n,ts:r.ts}});
  mineL.unshift(it);
  return SH.db.doc('fila/'+SH.uid).set({items:mineL.slice(0,8)}).then(function(){filaBusy=false;return true},function(){filaBusy=false;SH.denied=true;refreshAll();return false});
}

/* ======================= solicitações de alteração (alunos → gestão) ======================= */
var REQ_T=[['onibus','Horário ou itinerário de ônibus'],['ponto','Ponto de ônibus (novo, mudou ou fechado)'],['wifi','Rede Wi-Fi (nome, senha, fora do ar, nova rede)'],['servico','Horário de serviço (RU, biblioteca, secretaria)'],['planta','Planta de prédio faltando ou desatualizada'],['outro','Outro assunto']];
var REQ_ST={nova:['Nova','warn'],analise:['Em análise','warn'],aprovada:['Aprovada','good'],feita:['Resolvida','good'],recusada:['Recusada','bad']};
var RKEY='cse-req-local';
SH.req=[];SH.myReq=[];SH.members=[];
var reqLocal=[];try{reqLocal=JSON.parse(localStorage.getItem(RKEY))||[]}catch(e){}
function reqTipo(t){for(var i=0;i<REQ_T.length;i++)if(REQ_T[i][0]===t)return REQ_T[i][1];return 'Outro assunto'}
function reqStatus(id){var r=(GST.respostas||{})[id];return r&&REQ_ST[r.st]?r:{st:'nova',nota:''}}
function myReqs(){return SH.on?SH.myReq:reqLocal}
function sendReq(t,alvo,txt){
  var now=Date.now(),it={id:'q'+now.toString(36),t:t,alvo:cleanTxt(alvo,80),txt:cleanTxt(txt,400),ts:now};
  if(!SH.on){reqLocal.unshift(it);reqLocal=reqLocal.slice(0,10);try{localStorage.setItem(RKEY,JSON.stringify(reqLocal))}catch(e){}return Promise.resolve(true)}
  if(!canPost())return Promise.resolve(false);
  var l=[it].concat(SH.myReq.map(function(r){return {id:r.id,t:r.t,alvo:r.alvo,txt:r.txt,ts:r.ts}})).slice(0,10);
  return SH.db.doc('requests/'+SH.uid).set({items:l}).then(function(){return true},function(){return false});
}
function flatReq(docs){
  var out=[];docs.forEach(function(d){var it=(d.data()||{}).items;if(!Array.isArray(it))return;it.slice(0,10).forEach(function(r){if(!r||typeof r!=='object')return;
    out.push({id:String(r.id||''),t:String(r.t||'outro'),alvo:cleanTxt(r.alvo,80),txt:cleanTxt(r.txt,400),ts:+r.ts||0,owner:d.id})})});
  return out.sort(function(a,b){return b.ts-a.ts});
}
function myReqHTML(){
  var l=myReqs();
  return '<div><h2>Solicitações</h2></div><p class="muted small">Viu um horário errado, um ponto que mudou ou uma rede nova? Peça a correção para a gestão do app.</p>'+
    (l.length?'<div class="reqs">'+l.map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];
      return '<div class="req"><div class="req-h"><b>'+esc(reqTipo(r.t))+'</b><span class="pill '+S[1]+'">'+S[0]+'</span></div>'+(r.alvo?'<small>'+esc(r.alvo)+'</small>':'')+'<p>'+esc(r.txt)+'</p>'+(s.nota?'<p class="req-resp"><b>Resposta da gestão:</b> '+esc(s.nota)+'</p>':'')+'<small class="muted">'+agoTxt(r.ts)+'</small></div>'}).join('')+'</div>':'<p class="muted small">Você ainda não enviou nenhuma.</p>')+
    '<button type="button" class="copy" data-req="outro||">Nova solicitação</button>';
}
var reqM=null,reqCtx=null;
function openReq(t,alvo){
  reqCtx={t:t||'outro',alvo:alvo||''};
  if(!reqM){document.body.insertAdjacentHTML('beforeend','<div class="cfgmodal" id="reqM" role="dialog" aria-modal="true" aria-labelledby="reqTitle" hidden><div class="cfgsheet narrow"><div class="cfghead"><h2 id="reqTitle">Sugerir correção</h2><button type="button" class="cfgclose" id="reqClose" aria-label="Fechar">'+XSVG+'</button></div><div id="reqBody"></div></div></div>');
    reqM=$('#reqM');$('#reqClose').addEventListener('click',closeReq);reqM.addEventListener('click',function(e){if(e.target===reqM)closeReq()});
    reqM.addEventListener('submit',function(e){e.preventDefault();var t=$('#rqT').value,a=$('#rqA').value,x=$('#rqX').value.trim(),er=$('#rqErr'),b=reqM.querySelector('.rq-send');
      if(x.length<8){er.textContent='Conte um pouco mais (pelo menos 8 letras).';$('#rqX').focus();return}
      b.disabled=true;b.textContent='Enviando…';
      sendReq(t,a,x).then(function(ok){if(ok){$('#reqBody').innerHTML='<p class="big-ok">Pedido enviado.</p><p class="muted">A gestão vai analisar. Acompanhe a resposta em Ajustes, na parte de Solicitações.</p><button type="button" class="copy" id="rqDone">Fechar</button>';$('#rqDone').addEventListener('click',closeReq);$('#rqDone').focus();if(!cfgM.hidden)renderCfg()}
        else{b.disabled=false;b.textContent='Enviar';er.textContent=blocked(SH.uid)?'Sua conta não pode enviar pedidos no momento.':'Não deu para enviar. Você precisa de acesso de colaborador.'}})});
  }
  $('#reqBody').innerHTML='<form class="gform" novalidate>'+
    '<label class="gf">Assunto<select id="rqT">'+REQ_T.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===reqCtx.t?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></label>'+
    '<label class="gf">Sobre o quê?<input type="text" id="rqA" maxlength="80" value="'+esc(reqCtx.alvo)+'" placeholder="Ex.: Linha 3, RU Central, Biblioteca do CT"></label>'+
    '<label class="gf">O que precisa mudar?<textarea id="rqX" maxlength="400" rows="4" placeholder="Ex.: o último ônibus da linha 3 está saindo 23h40, não meia-noite."></textarea></label>'+
    '<p class="err small" id="rqErr" role="alert"></p><button type="submit" class="copy rq-send">Enviar</button>'+
    '<p class="muted small">A gestão vê quem enviou. Os colegas não veem.</p></form>';
  reqM.hidden=false;document.documentElement.style.overflow='hidden';setTimeout(function(){$('#rqX').focus()},30);
}
function closeReq(){if(reqM){reqM.hidden=true;if(cfgM.hidden&&glM.hidden&&(!gestM||gestM.hidden))document.documentElement.style.overflow=''}}
var XSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

/* ---------- ganchos nas telas existentes ---------- */
var _renderCfg=renderCfg;
renderCfg=function(f){_renderCfg(f);var R=$('#cfgR');if(R&&!R.querySelector('.reqsec')){R.insertAdjacentHTML('beforeend','<div class="reqsec">'+myReqHTML()+'</div>')}};
var _placeCard=placeCard;
placeCard=function(id,now,bare){
  var s=_placeCard(id,now,bare);if(!s)return s;
  var extra='';
  if(RUS.indexOf(id)>=0)extra+='<div class="fila-in"><p class="small"><b>Fila agora</b></p>'+filaRow(id,now)+'</div>';
  if(PL[id]&&PL[id].fechadoTemp)extra+='<div class="warnbox"><b>Fechado temporariamente</b>Informado pela gestão do app.</div>';
  extra+='<button type="button" class="linkbtn sugg" data-req="servico||'+esc(PL[id].name)+'">Sugerir correção</button>';
  return s.slice(0,-6)+extra+'</div>';
};
var _renderDetail=renderDetail;
renderDetail=function(f){
  _renderDetail(f);var s=state.sel;if(!s)return;var t=null,a='';
  if(s.kind==='stop'&&STOPS[s.id]){t='ponto';a='Ponto '+STOPS[s.id].name}
  else if(s.kind==='line'&&LINES[s.id]){t='onibus';a='Linha '+s.id+' · '+LINES[s.id].name}
  else if(s.kind==='wifi'&&WIFI[s.id]){t='wifi';a='Wi-Fi '+WIFI[s.id].name}
  if(t)detail.insertAdjacentHTML('beforeend','<button type="button" class="linkbtn sugg" data-req="'+t+'||'+esc(a)+'">Sugerir correção</button>');
};
function lineNote(id){var l=LINES[id];return (l.susp?'<div class="warnbox"><b>Linha suspensa</b>A gestão suspendeu esta linha. Os horários abaixo não estão valendo.</div>':'')+(l.aviso?'<div class="warnbox"><b>Aviso da gestão</b>'+esc(l.aviso)+'</div>':'')}
function stopNote(id){var s=STOPS[id];return (s.off?'<div class="warnbox"><b>Ponto desativado</b>Os ônibus não estão parando aqui por enquanto.</div>':'')+(s.aviso?'<div class="warnbox"><b>Aviso da gestão</b>'+esc(s.aviso)+'</div>':'')}

document.addEventListener('click',function(e){
  var t=e.target.closest('[data-filaopen],[data-fila],[data-req]');if(!t)return;
  if(t.dataset.filaopen){filaOpen=filaOpen===t.dataset.filaopen?null:t.dataset.filaopen;filaMsg='';refreshAll();var b=document.querySelector('[data-filaopen="'+t.dataset.filaopen+'"]');if(b)b.focus({preventScroll:true});return}
  if(t.dataset.fila){var ru=t.dataset.fila,n=+t.dataset.n;t.disabled=true;
    sendFila(ru,n).then(function(ok){filaOpen=null;filaMsg=ok?'Obrigado! Fila do '+PL[ru].name+' informada.':'Não deu para enviar agora.';refreshAll();drawShared();setTimeout(function(){filaMsg='';},6000)});return}
  if(t.dataset.req!=null){var p=t.dataset.req.split('||');openReq(p[0],p[1]||'');}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&reqM&&!reqM.hidden){e.stopPropagation();closeReq()}},true);

/* ======================= tela do gestor ======================= */
var gestM=null,gTab='geral',gEdit=null,gFilter={req:'abertas',q:'',svc:''},gNames={},ASSETS=null;
var GTABS=[['geral','Visão geral'],['usuarios','Usuários'],['linhas','Linhas'],['pontos','Pontos'],['wifi','Redes Wi-Fi'],['servicos','Serviços e horários'],['solic','Solicitações'],['plantas','Plantas dos prédios'],['avisos','Avisos e filas']];
function gToast(msg,bad){var t=$('#gToast');if(!t){document.body.insertAdjacentHTML('beforeend','<div class="gtoast" id="gToast" role="status" aria-live="polite"></div>');t=$('#gToast')}t.textContent=msg;t.className='gtoast show'+(bad?' bad':'');clearTimeout(t._h);t._h=setTimeout(function(){t.className='gtoast'},3200)}
function ensureGest(){
  if(gestM)return;
  document.body.insertAdjacentHTML('beforeend','<div class="cfgmodal" id="gestM" role="dialog" aria-modal="true" aria-labelledby="gTitle" hidden><div class="cfgsheet gsheet"><div class="cfghead"><div><h2 id="gTitle">Gestão</h2><p class="muted small" id="gRole"></p></div><button type="button" class="cfgclose" id="gClose" aria-label="Fechar gestão">'+XSVG+'</button></div><div class="glay"><nav class="gnav" id="gNav" aria-label="Seções da gestão"></nav><div class="gbody" id="gBody"></div></div></div></div>');
  gestM=$('#gestM');
  $('#gClose').addEventListener('click',closeGest);
  gestM.addEventListener('click',function(e){if(e.target===gestM)closeGest()});
  gestM.addEventListener('click',onGestClick);gestM.addEventListener('change',onGestChange);gestM.addEventListener('submit',onGestSubmit);gestM.addEventListener('input',function(e){
    if(e.target.id==='gUq'){gFilter.q=e.target.value;var c=$('#gUlist');if(c)c.innerHTML=usersList()}
    if(e.target.id==='gSq'){gFilter.svc=e.target.value;var c2=$('#gSlist');if(c2)c2.innerHTML=svcList()}
  });
}
function openGest(tab){ensureGest();if(tab)gTab=tab;gEdit=null;renderGest();gestM.hidden=false;document.documentElement.style.overflow='hidden';var b=$('#gestBtn');if(b)b.setAttribute('aria-pressed','true');setTimeout(function(){$('#gClose').focus({preventScroll:true})},30)}
function closeGest(){if(!gestM)return;gestM.hidden=true;if(cfgM.hidden&&glM.hidden)document.documentElement.style.overflow='';var b=$('#gestBtn');if(b){b.setAttribute('aria-pressed','false');b.focus({preventScroll:true})}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gestM&&!gestM.hidden&&(!reqM||reqM.hidden)){e.stopPropagation();closeGest()}},true);
function setGestor(v){
  GESTOR=v;var b=$('#gestBtn');if(b)b.hidden=!v;
  if(v===true&&SH.on){
    SH.db.collection('members').onSnapshot(function(s){SH.members=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,first:+x.first||0,last:+x.last||0,visits:+x.visits||0}});if(gestM&&!gestM.hidden&&gTab!=='solic')renderGest()},function(){});
    SH.db.collection('requests').onSnapshot(function(s){SH.req=flatReq(s.docs);if(gestM&&!gestM.hidden)renderGest()},function(){});
  }
}
function names(ids){
  ids=ids.filter(function(id){return id&&!(id in gNames)});
  if(!ids.length||!SH.user)return;
  ids.forEach(function(id){gNames[id]=''});
  SH.user.profiles(ids).then(function(ps){Object.keys(ps).forEach(function(id){gNames[id]=ps[id].name||''});if(gestM&&!gestM.hidden)renderGest()});
}
function who(id){if(!id)return 'Este aparelho';if(id===SH.uid)return 'Você';return gNames[id]||'Pessoa sem nome visível'}
function dmy(ts){if(!ts)return '—';var d=new Date(ts);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' '+fmt(d.getHours()*60+d.getMinutes())}
function allReqs(){return SH.on?SH.req:reqLocal.map(function(r){return Object.assign({owner:''},r)})}
function renderGest(){
  if(!gestM)return;
  var role=GESTOR===true?'Você é gestor porque tem acesso de editor a esta página. Para incluir outro gestor, compartilhe com acesso de editor.':'Modo demonstração: aberto fora do claude.ai, as mudanças ficam só neste aparelho.';
  $('#gRole').textContent=role;
  var pend=allReqs().filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'}).length;
  $('#gNav').innerHTML=GTABS.map(function(t){return '<button type="button" class="gtab" data-gtab="'+t[0]+'" aria-current="'+(gTab===t[0]?'page':'false')+'">'+t[1]+(t[0]==='solic'&&pend?'<span class="gcount">'+pend+'</span>':'')+'</button>'}).join('');
  var a=document.activeElement,keep=a&&$('#gBody').contains(a)&&a.id?a.id:null,val=keep&&a.value!==undefined?a.value:null;
  var f={geral:gGeral,usuarios:gUsers,linhas:gLinhas,pontos:gPontos,wifi:gWifiTab,servicos:gServicos,solic:gSolic,plantas:gPlantas,avisos:gAvisos}[gTab]||gGeral;
  $('#gBody').innerHTML=f();
  if(keep){var el=document.getElementById(keep);if(el){if(val!=null&&el.value!==undefined&&el.type!=='file')el.value=val;el.focus({preventScroll:true})}}
}
function tile(n,l,tab,tone){return '<button type="button" class="gtile'+(tone?' '+tone:'')+'" data-gtab="'+tab+'"><b>'+n+'</b><span>'+l+'</span></button>'}
function gGeral(){
  var reqs=allReqs(),pend=reqs.filter(function(r){var s=reqStatus(r.id).st;return s==='nova'||s==='analise'});
  var susp=Object.keys(LINES).filter(function(k){return LINES[k].susp}).length,off=Object.keys(STOPS).filter(function(k){return STOPS[k].off}).length;
  var fechados=Object.keys(PL).filter(function(k){return PL[k].fechadoTemp}).length;
  return '<h3 class="gh">Agora</h3><div class="gtiles">'+
    tile(SH.on?SH.members.length:'—','Usuários',"usuarios")+
    tile(pend.length,'Solicitações abertas','solic',pend.length?'warn':'')+
    tile(liveReps().length,'Avisos ao vivo','avisos')+
    tile(filaAll().length,'Filas informadas (45 min)','avisos')+
    tile(susp,'Linhas suspensas','linhas',susp?'bad':'')+
    tile(off,'Pontos desativados','pontos',off?'bad':'')+
    tile(Object.keys(WIFI).length,'Redes Wi-Fi','wifi')+
    tile(fechados,'Serviços fechados','servicos',fechados?'bad':'')+
    tile((GST.plantas.items||[]).length,'Plantas enviadas','plantas')+
  '</div>'+
  '<h3 class="gh">Fila do RU</h3><div class="glist">'+RUS.map(function(k){var f=filaOf(k);return '<div class="grow2"><span class="grow"><b>'+esc(PL[k].name)+'</b><small>'+(f?f.count+' aviso(s) · último '+agoTxt(f.last):'Ninguém informou nos últimos 45 min')+'</small></span>'+filaPill(k)+'</div>'}).join('')+'</div>'+
  '<h3 class="gh">Últimas solicitações</h3>'+(reqs.length?'<div class="glist">'+reqs.slice(0,4).map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];return '<button type="button" class="grow2 btnrow" data-gtab="solic"><span class="grow"><b>'+esc(reqTipo(r.t))+'</b><small>'+esc(r.alvo||'')+' · '+agoTxt(r.ts)+'</small></span><span class="pill '+S[1]+'">'+S[0]+'</span></button>'}).join('')+'</div>':'<p class="muted small">Nenhuma solicitação ainda.</p>');
}
/* ---------- usuários ---------- */
function userStats(id){
  var now=Date.now();
  return {av:SH.reps.filter(function(r){return r.owner===id&&r.ts>now-REP_TTL}).length,fi:SH.fila.filter(function(r){return r.owner===id&&r.ts>now-FILA_TTL}).length,rq:SH.req.filter(function(r){return r.owner===id}).length};
}
function usersList(){
  var q=glFold(gFilter.q.trim()),l=SH.members.slice().sort(function(a,b){return b.last-a.last});
  names(l.map(function(m){return m.id}));
  l=l.filter(function(m){return !q||glFold(who(m.id)).indexOf(q)>=0});
  if(!l.length)return '<p class="muted small">'+(q?'Ninguém com esse nome.':'Ninguém abriu o app desde que a gestão foi ligada.')+'</p>';
  return l.map(function(m){var st=userStats(m.id),b=blocked(m.id);
    return '<div class="grow2 urow'+(b?' isblk':'')+'"><span class="grow"><b>'+esc(who(m.id))+'</b>'+(b?' <span class="pill bad">Bloqueado</span>':'')+'<small>Primeira visita '+dmy(m.first)+' · última '+agoTxt(m.last)+' · '+m.visits+' visita(s)</small><small>'+st.av+' aviso(s) ao vivo · '+st.fi+' fila(s) · '+st.rq+' solicitação(ões)</small></span>'+
      (m.id===SH.uid?'':'<button type="button" class="copy'+(b?'':' danger')+'" data-gblock="'+esc(m.id)+'">'+(b?'Desbloquear':'Bloquear')+'</button>')+'</div>'}).join('');
}
function gUsers(){
  if(!SH.on)return '<h3 class="gh">Usuários</h3><p class="muted">A lista de usuários aparece quando o app está publicado no claude.ai: cada pessoa que abre o app entra aqui, com a data da primeira e da última visita e o que ela enviou.</p><div class="glist"><div class="grow2"><span class="grow"><b>Este aparelho</b><small>'+filaLocal.length+' fila(s) · '+reqLocal.length+' solicitação(ões)</small></span></div></div>';
  return '<h3 class="gh">Usuários ('+SH.members.length+')</h3>'+
    '<p class="muted small">Bloquear esconde os avisos e as filas da pessoa e impede novos envios pelo app. Para tirar o acesso de vez, use o menu Compartilhar da página.</p>'+
    '<label class="gf"><span class="sr">Buscar pessoa</span><input type="search" id="gUq" placeholder="Buscar pelo nome" value="'+esc(gFilter.q)+'"></label>'+
    '<div class="glist" id="gUlist">'+usersList()+'</div>';
}
/* ---------- linhas ---------- */
function gLinhas(){
  return '<h3 class="gh">Linhas internas</h3><p class="muted small">Suspenda uma linha, deixe um aviso para os alunos ou troque os horários de saída. Formato dos horários: <span class="mono">05:00-19:00/10, 19:30-23:30/30</span> (início-fim/intervalo em minutos), separados por vírgula. Saída avulsa: só o horário.</p>'+
  '<div class="glist">'+Object.keys(LINES).map(function(id){var l=LINES[id],g=(GST.linhas||{})[id]||{},open=gEdit==='l:'+id;
    return '<div class="gcard'+(open?' open':'')+'"><div class="grow2">'+badge(id)+'<span class="grow"><b>'+esc(l.name)+'</b><small>'+(l.susp?'Suspensa':'Em operação')+(l.aviso?' · com aviso':'')+(g.hor?' · horários alterados':'')+'</small></span>'+(l.susp?'<span class="pill bad">Suspensa</span>':'')+'<button type="button" class="copy" data-gedit="l:'+id+'">'+(open?'Fechar':'Editar')+'</button></div>'+
      (open?'<form class="gform" data-gform="linha" data-id="'+id+'">'+
        tg('gLsusp',l.susp,'Linha suspensa','Some do planejador de trajeto e aparece riscada no mapa.')+
        '<label class="gf">Aviso para os alunos<input type="text" id="gLaviso" maxlength="200" value="'+esc(g.aviso||'')+'" placeholder="Ex.: desvio pela Av. Horácio Macedo até sexta"></label>'+
        '<label class="gf">Resumo do horário<input type="text" id="gLsum" maxlength="200" value="'+esc(l.sum)+'"></label>'+
        l.trips.map(function(tr,i){var src=(g.hor&&g.hor[i])||compressDeps(tr.deps);return '<label class="gf">Saídas · sentido '+esc(tr.halves[0].to)+' ('+tr.deps.length+' por dia)<textarea id="gLh'+i+'" rows="2" class="mono">'+esc(src)+'</textarea></label>'}).join('')+
        '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(GST.linhas[id]?'<button type="button" class="copy" data-greset="linhas:'+id+'">Voltar ao original</button>':'')+'</div></form>':'')+
    '</div>'}).join('')+'</div>';
}
/* ---------- pontos ---------- */
var pickP=null;
function pickMapHTML(p,others){
  var dots=(others||[]).map(function(o){return '<circle cx="'+o[0]+'" cy="'+o[1]+'" r="5" class="pk-o"/>'}).join('');
  return '<div class="pkwrap"><svg class="pkmap" id="pkMap" viewBox="90 20 1314 580" role="img" aria-label="Toque no mapa para posicionar"><image href="'+MAPHD+'" x="90" y="20" width="1314" height="580" preserveAspectRatio="none"/>'+dots+(p?'<g transform="translate('+p[0]+','+p[1]+')"><circle r="16" class="pk-h"/><circle r="7" class="pk-p"/></g>':'')+'</svg></div><p class="muted small">Toque no mapa para mudar a posição'+(p?' · x '+Math.round(p[0])+', y '+Math.round(p[1]):'')+'.</p>';
}
function gPontos(){
  var ids=Object.keys(STOPS).sort(function(a,b){return STOPS[a].name.localeCompare(STOPS[b].name,'pt')});
  return '<h3 class="gh">Pontos de ônibus</h3><p class="muted small">Renomeie, mude de lugar ou desative um ponto. Ao mover, o traçado das linhas passa pela nova posição.</p>'+
  '<div class="glist">'+ids.map(function(id){var s=STOPS[id],open=gEdit==='p:'+id,ls=linesAt(id);
    return '<div class="gcard'+(open?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(s.name)+'</b><small>Linhas '+ls.join(', ')+(GST.pontos[id]?' · alterado':'')+'</small></span>'+(s.off?'<span class="pill bad">Desativado</span>':'')+'<button type="button" class="copy" data-gedit="p:'+id+'">'+(open?'Fechar':'Editar')+'</button></div>'+
      (open?'<form class="gform" data-gform="ponto" data-id="'+id+'">'+
        '<label class="gf">Nome<input type="text" id="gPn" maxlength="60" value="'+esc(s.name)+'" required></label>'+
        '<label class="gf">Nome curto no mapa<input type="text" id="gPs" maxlength="24" value="'+esc(s.short||'')+'"></label>'+
        tg('gPoff',s.off,'Ponto desativado','Aparece apagado no mapa, com aviso para os alunos.')+
        '<label class="gf">Aviso<input type="text" id="gPav" maxlength="200" value="'+esc(s.aviso||'')+'" placeholder="Ex.: ponto provisório 50 m adiante"></label>'+
        pickMapHTML(pickP||s.p,Object.keys(STOPS).filter(function(k){return k!==id}).map(function(k){return STOPS[k].p}))+
        '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(GST.pontos[id]?'<button type="button" class="copy" data-greset="pontos:'+id+'">Voltar ao original</button>':'')+'</div></form>':'')+
    '</div>'}).join('')+'</div>';
}
/* ---------- wi-fi ---------- */
function gWifiTab(){
  var ids=Object.keys(WIFI),open=gEdit,newOpen=gEdit==='w:+';
  var removed=Object.keys(GST.wifi||{}).filter(function(k){return GST.wifi[k]&&GST.wifi[k].removed&&ORIG.wifi[k]});
  function form(id,w){return '<form class="gform" data-gform="wifi" data-id="'+id+'">'+
    '<label class="gf">Local<input type="text" id="gWn" maxlength="60" value="'+esc(w.name||'')+'" required placeholder="Ex.: Biblioteca do CCMN"></label>'+
    '<div class="g2"><label class="gf">Nome da rede (SSID)<input type="text" id="gWs" maxlength="40" value="'+esc(w.ssid||'')+'" placeholder="Ex.: UFRJ-Visitante"></label>'+
    '<label class="gf">Acesso<input type="text" id="gWa" maxlength="60" value="'+esc(w.acesso||'')+'" placeholder="Sem senha"></label></div>'+
    '<label class="gf">Dica<input type="text" id="gWd" maxlength="160" value="'+esc(w.note||'')+'" placeholder="Ex.: melhor sinal perto da janela"></label>'+
    pickMapHTML(pickP||w.p,Object.keys(WIFI).filter(function(k){return k!==id}).map(function(k){return WIFI[k].p}))+
    '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(id!=='+'?'<button type="button" class="copy danger" data-gwdel="'+id+'">Remover rede</button>':'')+(id!=='+'&&GST.wifi[id]&&ORIG.wifi[id]?'<button type="button" class="copy" data-greset="wifi:'+id+'">Voltar ao original</button>':'')+'</div></form>'}
  return '<h3 class="gh">Redes Wi-Fi</h3><p class="muted small">Cadastre redes novas, corrija nome e acesso ou tire do mapa uma rede que deixou de existir.</p>'+
    '<div class="gbtns"><button type="button" class="copy primary" data-gedit="w:+">'+(newOpen?'Cancelar':'Adicionar rede')+'</button></div>'+
    (newOpen?'<div class="gcard open">'+form('+',{})+'</div>':'')+
    '<div class="glist">'+ids.map(function(id){var w=WIFI[id],o=open==='w:'+id;
      return '<div class="gcard'+(o?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(w.name)+'</b><small>'+esc(w.ssid||'Rede aberta')+' · nota '+br(avgOf(id))+' ('+votesOf(id)+')'+(w.novo?' · cadastrada pela gestão':'')+'</small></span><button type="button" class="copy" data-gedit="w:'+id+'">'+(o?'Fechar':'Editar')+'</button></div>'+(o?form(id,w):'')+'</div>'}).join('')+'</div>'+
    (removed.length?'<h3 class="gh">Removidas</h3><div class="glist">'+removed.map(function(id){return '<div class="grow2"><span class="grow"><b>'+esc(ORIG.wifi[id].name)+'</b></span><button type="button" class="copy" data-greset="wifi:'+id+'">Restaurar</button></div>'}).join('')+'</div>':'');
}
/* ---------- serviços ---------- */
var SVC_CAT={comida:'Alimentação',biblio:'Biblioteca',atend:'Atendimento',seg:'Segurança',onibus:'Ônibus'};
function svcList(){
  var q=glFold(gFilter.svc.trim());
  var ks=Object.keys(PL).filter(function(k){var it=PL[k];return ORIG.pl[k]&&it.cat!=='aula'&&!it.line&&(!q||glFold(it.name+' '+it.where).indexOf(q)>=0)});
  if(!ks.length)return '<p class="muted small">Nada encontrado.</p>';
  return ks.map(function(k){var it=PL[k],g=GST.servicos[k]||{},o=gEdit==='s:'+k;
    return '<div class="gcard'+(o?' open':'')+'"><div class="grow2"><span class="grow"><b>'+esc(it.name)+'</b><small>'+(SVC_CAT[it.cat]||'')+' · '+rangesTxt(it.wk,it.incl)+(GST.servicos[k]?' · alterado':'')+'</small></span>'+(it.fechadoTemp?'<span class="pill bad">Fechado</span>':'')+'<button type="button" class="copy" data-gedit="s:'+k+'">'+(o?'Fechar':'Editar')+'</button></div>'+
      (o?'<form class="gform" data-gform="servico" data-id="'+k+'">'+
        tg('gSfech',it.fechadoTemp,'Fechado temporariamente','Aparece como fechado em todo o app até você desligar.')+
        '<div class="g2"><label class="gf">Segunda a sexta<input type="text" id="gSwk" class="mono" value="'+esc(g.wk!=null?g.wk:rangesStr(ORIG.pl[k].wk))+'" placeholder="07:00-10:00, 11:00-14:00"></label>'+
        '<label class="gf">Fim de semana<input type="text" id="gSwe" class="mono" value="'+esc(g.we!=null?g.we:rangesStr(ORIG.pl[k].we))+'" placeholder="fechado, 24h ou 08:00-12:00"></label></div>'+
        '<label class="gf">Observação<input type="text" id="gSno" maxlength="200" value="'+esc(g.note||'')+'" placeholder="'+esc(ORIG.pl[k].note||'Ex.: cardápio vegetariano às quartas')+'"></label>'+
        '<p class="err small" id="gErr" role="alert"></p><div class="gbtns"><button type="submit" class="copy primary">Salvar</button>'+(GST.servicos[k]?'<button type="button" class="copy" data-greset="servicos:'+k+'">Voltar ao original</button>':'')+'</div></form>':'')+'</div>'}).join('');
}
function gServicos(){
  return '<h3 class="gh">Serviços e horários</h3><p class="muted small">Restaurantes, bibliotecas, secretarias e segurança. Deixe o campo vazio para manter o horário original.</p>'+
    '<label class="gf"><span class="sr">Buscar serviço</span><input type="search" id="gSq" placeholder="Buscar: RU, biblioteca, secretaria" value="'+esc(gFilter.svc)+'"></label><div class="glist" id="gSlist">'+svcList()+'</div>';
}
/* ---------- solicitações ---------- */
var REQ_GO={onibus:'linhas',ponto:'pontos',wifi:'wifi',servico:'servicos',planta:'plantas'};
function gSolic(){
  var all=allReqs();names(all.map(function(r){return r.owner}));
  var l=all.filter(function(r){var s=reqStatus(r.id).st;return gFilter.req==='todas'||(gFilter.req==='abertas'?(s==='nova'||s==='analise'):(s!=='nova'&&s!=='analise'))});
  var chips=[['abertas','Abertas'],['fechadas','Respondidas'],['todas','Todas']];
  return '<h3 class="gh">Solicitações de alteração</h3><p class="muted small">Pedidos que os alunos mandam pelo botão Sugerir correção. A resposta aparece para quem pediu.</p>'+
    '<div class="chips">'+chips.map(function(c){return '<button type="button" class="chip" data-greq="'+c[0]+'" aria-pressed="'+(gFilter.req===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'+
    (l.length?'<div class="glist">'+l.map(function(r){var s=reqStatus(r.id),S=REQ_ST[s.st];
      return '<form class="gcard open gform" data-gform="resp" data-id="'+esc(r.id)+'"><div class="req-h"><b>'+esc(reqTipo(r.t))+'</b><span class="pill '+S[1]+'">'+S[0]+'</span></div>'+(r.alvo?'<small><b>'+esc(r.alvo)+'</b></small>':'')+'<p>'+esc(r.txt)+'</p><small class="muted">'+esc(who(r.owner))+' · '+dmy(r.ts)+'</small>'+
        '<div class="g2"><label class="gf">Situação<select name="st">'+Object.keys(REQ_ST).map(function(k){return '<option value="'+k+'"'+(k===s.st?' selected':'')+'>'+REQ_ST[k][0]+'</option>'}).join('')+'</select></label>'+
        '<label class="gf">Resposta para o aluno<input type="text" name="nota" maxlength="240" value="'+esc(s.nota||'')+'" placeholder="Ex.: corrigido, obrigado!"></label></div>'+
        '<div class="gbtns"><button type="submit" class="copy primary">Responder</button>'+(REQ_GO[r.t]?'<button type="button" class="copy" data-gtab="'+REQ_GO[r.t]+'">Abrir '+esc(GTABS.filter(function(t){return t[0]===REQ_GO[r.t]})[0][1].toLowerCase())+'</button>':'')+'</div></form>'}).join('')+'</div>':'<p class="muted small">Nada por aqui.</p>');
}
/* ---------- plantas ---------- */
var PLANT_B=[['ct','Centro de Tecnologia (CT)'],['ccmn','CCMN'],['ccs','CCS'],['letras','Faculdade de Letras'],['reitoria','Reitoria · EBA · FAU'],['eefd','EEFD'],['hu','Hospital Universitário'],['ru','Restaurante Universitário Central']];
function plantName(p){for(var i=0;i<PLANT_B.length;i++)if(PLANT_B[i][0]===p.bld)return PLANT_B[i][1];return p.bname||p.bld}
function plantSrc(p){return p.asset?'/_blob/'+p.asset:(p.data||'')}
function gPlantas(){
  var items=(GST.plantas.items||[]).slice().sort(function(a,b){return b.ts-a.ts});
  var up=GESTOR===true?'':'<p class="muted small">No modo demonstração a imagem fica guardada só neste aparelho (até 1,5 MB).</p>';
  return '<h3 class="gh">Plantas dos prédios</h3><p class="muted small">Envie a planta de um andar (imagem ou PDF). Ela aparece na aba Lugares, no prédio escolhido.</p>'+
    '<form class="gcard open gform" data-gform="planta">'+
      '<div class="g2"><label class="gf">Prédio<select id="gPb">'+PLANT_B.map(function(b){return '<option value="'+b[0]+'">'+b[1]+'</option>'}).join('')+'<option value="outro">Outro prédio…</option></select></label>'+
      '<label class="gf" id="gPbnW" hidden>Nome do prédio<input type="text" id="gPbn" maxlength="60" placeholder="Ex.: Instituto de Biologia"></label></div>'+
      '<div class="g2"><label class="gf">Bloco<input type="text" id="gPbl" maxlength="20" placeholder="Ex.: A (opcional)"></label>'+
      '<label class="gf">Andar<input type="text" id="gPan" maxlength="20" placeholder="Ex.: Térreo, 2º andar" required></label></div>'+
      '<label class="gf">Arquivo<input type="file" id="gPf" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf" required></label>'+
      '<p class="err small" id="gErr" role="alert"></p>'+up+'<div class="gbtns"><button type="submit" class="copy primary">Enviar planta</button></div></form>'+
    (items.length?'<div class="pgal">'+items.map(function(p){var pdf=p.tipo==='application/pdf';
      return '<figure class="pfig">'+(pdf?'<a class="pdfbox" href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener">PDF</a>':'<a href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener"><img src="'+esc(plantSrc(p))+'" alt="Planta: '+esc(plantName(p))+', '+esc(p.andar)+'" loading="lazy"></a>')+
        '<figcaption><b>'+esc(plantName(p))+'</b><small>'+(p.bloco?'Bloco '+esc(p.bloco)+' · ':'')+esc(p.andar)+' · '+dmy(p.ts)+'</small><button type="button" class="copy danger" data-gpdel="'+esc(p.id)+'">Remover</button></figcaption></figure>'}).join('')+'</div>':'<p class="muted small">Nenhuma planta enviada ainda.</p>');
}
/* ---------- avisos e filas (moderação) ---------- */
function gAvisos(){
  var reps=liveReps(),fl=filaAll();names(reps.map(function(r){return r.owner}).concat(fl.map(function(r){return r.owner})));
  return '<h3 class="gh">Avisos dos alunos ('+reps.length+')</h3>'+(reps.length?'<div class="glist">'+reps.map(function(r){var pl=placeOf(r.place);
      return '<div class="grow2"><span class="grow"><b>'+esc(repLabel(r.k))+'</b><small>'+esc(pl?pl.name:'')+(r.txt?' · “'+esc(r.txt)+'”':'')+'</small><small class="muted">'+esc(who(r.owner))+' · '+agoTxt(r.ts)+'</small></span><button type="button" class="copy danger" data-gmod="rep|'+esc(r.owner)+'|'+esc(r.id)+'">Remover</button>'+(r.owner&&r.owner!==SH.uid&&!blocked(r.owner)?'<button type="button" class="copy" data-gblock="'+esc(r.owner)+'">Bloquear autor</button>':'')+'</div>'}).join('')+'</div>':'<p class="muted small">Nenhum aviso ao vivo.</p>')+
    '<h3 class="gh">Filas informadas ('+fl.length+')</h3>'+(fl.length?'<div class="glist">'+fl.map(function(r){var L=FILA_N[r.n];
      return '<div class="grow2"><span class="grow"><b>'+esc(PL[r.ru].name)+'</b><small>'+L[0]+' · '+L[1]+'</small><small class="muted">'+esc(who(r.owner))+' · '+agoTxt(r.ts)+'</small></span><button type="button" class="copy danger" data-gmod="fila|'+esc(r.owner)+'|'+esc(r.id)+'">Remover</button></div>'}).join('')+'</div>':'<p class="muted small">Ninguém informou fila nos últimos 45 min.</p>');
}
/* ---------- ações ---------- */
function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function onGestClick(e){
  var t=e.target.closest('[data-gtab],[data-gedit],[data-greset],[data-gblock],[data-gwdel],[data-gpdel],[data-gmod],[data-greq]');
  var pk=e.target.closest('#pkMap');
  if(pk&&!t){var ctm=pk.getScreenCTM();if(!ctm)return;var pt=pk.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;var q=pt.matrixTransform(ctm.inverse());pickP=[Math.round(q.x),Math.round(q.y)];
    var form=pk.closest('form'),vals={};form.querySelectorAll('input,textarea,select').forEach(function(i){vals[i.id]=i.type==='checkbox'?i.checked:i.value});
    renderGest();Object.keys(vals).forEach(function(id){var el=document.getElementById(id);if(el){if(el.type==='checkbox')el.checked=vals[id];else el.value=vals[id]}});var m=$('#pkMap');if(m)m.focus&&m.focus();return}
  if(!t)return;
  if(t.dataset.gtab){gTab=t.dataset.gtab;gEdit=null;pickP=null;renderGest();$('#gBody').scrollTop=0;gestM.querySelector('.gsheet').scrollTop=0;var b=gestM.querySelector('[data-gtab="'+gTab+'"].gtab');if(b)b.focus();return}
  if(t.dataset.gedit){gEdit=gEdit===t.dataset.gedit?null:t.dataset.gedit;pickP=null;renderGest();var f=gestM.querySelector('form[data-gform] input,form[data-gform] textarea');if(f&&gEdit)f.focus();return}
  if(t.dataset.greq){gFilter.req=t.dataset.greq;renderGest();return}
  if(t.dataset.greset){var p=t.dataset.greset.split(':'),o=clone(GST[p[0]]);delete o[p[1]];gEdit=null;pickP=null;saveG(p[0],o);return}
  if(t.dataset.gblock){var id=t.dataset.gblock,b2=clone(GST.bloqueados);b2.ids=Array.isArray(b2.ids)?b2.ids:[];
    if(b2.ids.indexOf(id)>=0)b2.ids=b2.ids.filter(function(x){return x!==id});else b2.ids.push(id);saveG('bloqueados',b2);return}
  if(t.dataset.gwdel){var wid=t.dataset.gwdel,w=clone(GST.wifi);if(ORIG.wifi[wid])w[wid]={removed:true};else delete w[wid];gEdit=null;pickP=null;saveG('wifi',w);return}
  if(t.dataset.gpdel){var pid=t.dataset.gpdel,pl=clone(GST.plantas),it=(pl.items||[]).filter(function(x){return x.id===pid})[0];
    pl.items=(pl.items||[]).filter(function(x){return x.id!==pid});
    saveG('plantas',pl).then(function(ok){if(ok&&it&&it.asset&&ASSETS)ASSETS.delete(it.asset).catch(function(){})});return}
  if(t.dataset.gmod){var m=t.dataset.gmod.split('|'),kind=m[0],owner=m[1],rid=m[2];
    if(!SH.on){if(kind==='fila'){filaLocal=filaLocal.filter(function(r){return r.id!==rid});try{localStorage.setItem(FKEY,JSON.stringify(filaLocal))}catch(err){}}refreshAll();drawShared();renderGest();return}
    var src=kind==='rep'?SH.reps:SH.fila,keep=src.filter(function(r){return r.owner===owner&&r.id!==rid}).map(function(r){return kind==='rep'?{id:r.id,k:r.k,place:r.place,txt:r.txt,ts:r.ts}:{id:r.id,ru:r.ru,n:r.n,ts:r.ts}});
    SH.db.doc((kind==='rep'?'reports/':'fila/')+owner).set({items:keep}).then(function(){gToast('Removido.')},function(){gToast('Não deu para remover.',1)});return}
}
function onGestChange(e){
  if(e.target.id==='gPb'){var w=$('#gPbnW');if(w)w.hidden=e.target.value!=='outro'}
}
function onGestSubmit(e){
  var f=e.target.closest('form[data-gform]');if(!f)return;e.preventDefault();
  var kind=f.dataset.gform,id=f.dataset.id,err=f.querySelector('#gErr')||{},v=function(x){var el=f.querySelector('#'+x);return el?el.value:''},c=function(x){var el=f.querySelector('#'+x);return !!(el&&el.checked)};
  try{
    if(kind==='linha'){
      var l=LINES[id],o=clone(GST.linhas),hor=[];
      l.trips.forEach(function(tr,i){var txt=v('gLh'+i).trim(),d=parseDeps(txt);if(!d.length)throw new Error('Informe pelo menos uma saída.');hor.push(compressDeps(d)===compressDeps(ORIG.lines[id].deps[i])?'':compressDeps(d))});
      var g={susp:c('gLsusp'),aviso:cleanTxt(v('gLaviso'),200),sum:cleanTxt(v('gLsum'),200)===ORIG.lines[id].sum?'':cleanTxt(v('gLsum'),200)};
      if(hor.some(function(h){return h}))g.hor=hor;
      if(!g.susp&&!g.aviso&&!g.sum&&!g.hor)delete o[id];else o[id]=g;
      gEdit=null;saveG('linhas',o);
    }else if(kind==='ponto'){
      var n=cleanTxt(v('gPn'),60);if(!n)throw new Error('O ponto precisa de um nome.');
      var op=clone(GST.pontos),s0=ORIG.stops[id],p=pickP||STOPS[id].p;
      var gp={name:n===s0.name?'':n,short:cleanTxt(v('gPs'),24)===(s0.short||'')?'':cleanTxt(v('gPs'),24),off:c('gPoff'),aviso:cleanTxt(v('gPav'),200)};
      if(p[0]!==s0.p[0]||p[1]!==s0.p[1])gp.p=p;
      if(!gp.name&&!gp.short&&!gp.off&&!gp.aviso&&!gp.p)delete op[id];else op[id]=gp;
      gEdit=null;pickP=null;saveG('pontos',op);
    }else if(kind==='wifi'){
      var wn=cleanTxt(v('gWn'),60);if(!wn)throw new Error('Diga onde fica a rede.');
      var wid=id==='+'?'g'+Date.now().toString(36):id,wp=pickP||(WIFI[wid]&&WIFI[wid].p);
      if(!validP(wp))throw new Error('Toque no mapa para marcar onde fica a rede.');
      var ow=clone(GST.wifi);ow[wid]={name:wn,ssid:cleanTxt(v('gWs'),40),acesso:cleanTxt(v('gWa'),60),note:cleanTxt(v('gWd'),160),p:wp};
      gEdit=null;pickP=null;saveG('wifi',ow);
    }else if(kind==='servico'){
      var wk=v('gSwk').trim(),we=v('gSwe').trim().toLowerCase();
      if(wk&&!/^fechado$/i.test(wk))parseRanges(wk);if(we&&we!=='fechado')parseRanges(we);
      var os=clone(GST.servicos),gs={fechado:c('gSfech'),note:cleanTxt(v('gSno'),200)};
      if(wk!==rangesStr(ORIG.pl[id].wk))gs.wk=/^fechado$/i.test(wk)?'':wk;
      if(we!==rangesStr(ORIG.pl[id].we))gs.we=we;
      if(!gs.fechado&&!gs.note&&gs.wk==null&&gs.we==null)delete os[id];else os[id]=gs;
      gEdit=null;saveG('servicos',os);
    }else if(kind==='resp'){
      var orr=clone(GST.respostas);orr[id]={st:f.elements.st.value,nota:cleanTxt(f.elements.nota.value,240),ts:Date.now()};saveG('respostas',orr);
    }else if(kind==='planta'){
      upPlanta(f,err);
    }
  }catch(ex){err.textContent=ex.message||'Confira os campos.'}
}
function upPlanta(f,err){
  var file=$('#gPf').files[0],bld=$('#gPb').value,bname=cleanTxt($('#gPbn').value,60),and=cleanTxt($('#gPan').value,20),bl=cleanTxt($('#gPbl').value,20);
  if(bld==='outro'&&!bname)throw new Error('Diga o nome do prédio.');
  if(!and)throw new Error('Diga o andar.');
  if(!file)throw new Error('Escolha o arquivo da planta.');
  var tipo=file.type||(/\.pdf$/i.test(file.name)?'application/pdf':'');
  if(!/^(image\/(png|jpeg|webp|svg\+xml)|application\/pdf)$/.test(tipo))throw new Error('Use imagem (PNG, JPG, WebP, SVG) ou PDF.');
  var btn=f.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Enviando…';
  var rec={id:'pl'+Date.now().toString(36),bld:bld==='outro'?'x-'+glFold(bname).replace(/[^a-z0-9]+/g,'-').slice(0,30):bld,bname:bld==='outro'?bname:'',bloco:bl,andar:and,tipo:tipo,ts:Date.now()};
  function done(){var o=clone(GST.plantas);o.items=(o.items||[]).concat([rec]).slice(-60);saveG('plantas',o)}
  function fail(m){btn.disabled=false;btn.textContent='Enviar planta';err.textContent=m}
  if(GESTOR===true){
    (ASSETS?Promise.resolve(ASSETS):window.claude.use('assets')).then(function(a){
      if(!a)return fail('Só quem tem acesso de editor pode enviar plantas.');ASSETS=a;
      return a.upload(file,{type:tipo}).then(function(r){rec.asset=r.id;done()},function(x){fail(x&&x.code==='too_large'?'Arquivo grande demais (máximo 20 MB).':x&&x.code==='unsupported_type'?'Tipo de arquivo não aceito.':'Não deu para enviar agora.')});
    });
  }else{
    if(file.size>1.5*1024*1024)return fail('No modo demonstração o limite é 1,5 MB.');
    var rd=new FileReader();rd.onload=function(){rec.data=rd.result;done()};rd.onerror=function(){fail('Não deu para ler o arquivo.')};rd.readAsDataURL(file);
  }
}
/* plantas na aba Lugares */
function plantasDe(bld){return (GST.plantas.items||[]).filter(function(p){return p.bld===bld})}
function plantasHTML(bld){
  var l=plantasDe(bld).sort(function(a,b){return (a.bloco+a.andar).localeCompare(b.bloco+b.andar,'pt',{numeric:true})});if(!l.length)return '';
  return '<div class="plantas"><h3>Plantas oficiais</h3><p class="muted small">Enviadas pela gestão do app. Toque para ampliar.</p><div class="pgal">'+l.map(function(p){var pdf=p.tipo==='application/pdf';
    return '<figure class="pfig">'+(pdf?'<a class="pdfbox" href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener">PDF</a>':'<a href="'+esc(plantSrc(p))+'" target="_blank" rel="noopener"><img src="'+esc(plantSrc(p))+'" alt="Planta: '+(p.bloco?'bloco '+esc(p.bloco)+', ':'')+esc(p.andar)+'" loading="lazy"></a>')+'<figcaption><b>'+(p.bloco?'Bloco '+esc(p.bloco)+' · ':'')+esc(p.andar)+'</b></figcaption></figure>'}).join('')+'</div></div>';
}
/* ======================= Lugares: lista enxuta + planta ======================= */
var LCAT=[['todos','Todos'],['aberto','Abertos agora'],['comida','Alimentação'],['biblio','Bibliotecas'],['atend','Atendimento'],['seg','Segurança']];
var LORD={comida:0,biblio:1,atend:2,seg:3},LNAME={comida:'Alimentação',biblio:'Bibliotecas',atend:'Atendimento',seg:'Segurança'},LMAX=4;
pstate.more=pstate.more||{};
function lugRank(it,now){var s=statusOf(it,now);if(it.wk===null&&!it.fechadoTemp)return 4;return s.c==='good'?0:s.c==='warn'?1:2}
function lugHrs(it,we){return it.wk===null?'Sem horário fixo':rangesTxt(rangesOf(it,we),it.incl)}
function lugDetail(k,now){
  var it=PL[k],goPlan=it.bld&&BLD[it.bld]&&it.b;
  return '<div class="lgd" id="lgd-'+k+'"><dl class="kv"><dt>Onde</dt><dd>'+esc(it.where)+'</dd><dt>Seg. a sex.</dt><dd class="mono">'+rangesTxt(it.wk,it.incl)+'</dd><dt>Fim de semana</dt><dd class="mono">'+rangesTxt(it.we===undefined?'unk':it.we)+'</dd></dl>'+
    (it.fechadoTemp?'<div class="warnbox"><b>Fechado temporariamente</b>Informado pela gestão do app.</div>':'')+
    (it.note?'<p class="small muted keep">'+esc(it.note)+'</p>':'')+
    (RUS.indexOf(k)>=0?'<div class="fila-in lgfila"><p class="small"><b>Fila agora</b></p>'+filaRow(k,now)+'</div>':'')+
    '<div class="later">'+(goPlan?'<button class="copy" type="button" data-goplan="'+k+'">Ver na planta</button>':'')+(it.p&&!it.bld?'<button class="copy" type="button" data-showmap="'+k+'">Ver no mapa</button>':'')+
    '<button type="button" class="linkbtn sugg" data-req="servico||'+esc(it.name)+'">Sugerir correção</button></div></div>';
}
function lugRow(k,now,we){
  var it=PL[k],open=pstate.pl===k&&pstate.open;
  return '<div class="lgi'+(open?' open':'')+'"><button class="lgrow" type="button" data-lgo="'+k+'" aria-expanded="'+open+'"><span class="grow"><b>'+esc(it.name)+'</b><small>'+esc(it.s&&it.bld?it.where:it.where)+'</small></span><span class="lgr"><span class="mono lgh2">'+lugHrs(it,we)+'</span>'+pill(statusOf(it,now))+(RUS.indexOf(k)>=0&&filaOf(k)?filaPill(k):'')+'</span></button>'+(open?lugDetail(k,now):'')+'</div>';
}
hoursHTML=function(now){
  if(!LCAT.some(function(c){return c[0]===pstate.cat}))pstate.cat='todos';
  var q=glFold(pstate.q.trim()),we=isWeekend()&&!state.manual;
  var all=Object.keys(PL).filter(function(k){var it=PL[k];return LORD[it.cat]!==undefined&&!it.line});
  var nOpen=all.filter(function(k){return statusOf(PL[k],now).c==='good'}).length,nSoon=all.filter(function(k){return /Fecha em|Última em/.test(statusOf(PL[k],now).t)}).length;
  var list=all.filter(function(k){var it=PL[k],s=statusOf(it,now);
    if(pstate.cat==='aberto'){if(s.c==='bad'||it.wk===null||/Confirmar/.test(s.t))return false}
    else if(pstate.cat!=='todos'&&it.cat!==pstate.cat)return false;
    return !q||glFold(it.name+' '+(it.s||'')+' '+it.where).indexOf(q)>=0});
  list.sort(function(a,b){return LORD[PL[a].cat]-LORD[PL[b].cat]||lugRank(PL[a],now)-lugRank(PL[b],now)||PL[a].name.localeCompare(PL[b].name,'pt')});
  var groups={};list.forEach(function(k){(groups[PL[k].cat]=groups[PL[k].cat]||[]).push(k)});
  var cut=!q&&pstate.cat==='todos',out='';
  Object.keys(LORD).forEach(function(c){var g=groups[c];if(!g)return;
    var show=cut&&!pstate.more[c]&&g.length>LMAX+1?g.slice(0,LMAX):g;
    if(pstate.pl&&g.indexOf(pstate.pl)>=0&&show.indexOf(pstate.pl)<0)show=show.concat([pstate.pl]);
    out+='<div class="lgg"><h3 class="lgt">'+LNAME[c]+' <span class="muted">'+g.length+'</span></h3>'+show.map(function(k){return lugRow(k,now,we)}).join('')+
      (show.length<g.length?'<button type="button" class="linkbtn lgmore" data-lgmore="'+c+'">Ver mais '+(g.length-show.length)+'</button>':'')+'</div>'});
  return '<div><p class="eyebrow">'+(we?'Fim de semana':'Dia útil')+' · '+fmt(now)+'</p><h2>Onde fica e quando abre</h2></div>'+
    '<label class="fld"><span class="sr">Buscar local</span><input type="search" id="hq" placeholder="Buscar local, sala ou bloco" value="'+esc(pstate.q)+'"></label>'+
    '<div class="chips lgchips" role="group" aria-label="Filtrar">'+LCAT.map(function(c){return '<button class="chip" type="button" data-cat="'+c[0]+'" aria-pressed="'+(pstate.cat===c[0])+'">'+c[1]+(c[0]==='aberto'?' <span class="cnum">'+nOpen+'</span>':'')+'</button>'}).join('')+'</div>'+
    (nSoon?'<p class="small lgsoon"><i class="pin-dot warn"></i>'+nSoon+(nSoon>1?' locais fecham':' local fecha')+' em até 30 min</p>':'')+
    '<div class="lglist">'+(out||'<p class="muted">Nada encontrado. Tente outra palavra.</p>')+'</div>'+
    '<p class="muted small keep">Horários de dias úteis informados pela UFRJ; em férias e feriados podem mudar. Os horários dos ônibus estão na aba Trajetos.</p>';
};
buildingHTML=function(now){
  var extra=[];(GST.plantas.items||[]).forEach(function(p){if(!BLD[p.bld]&&extra.indexOf(p.bld)<0)extra.push(p.bld)});
  if(!BLD[pstate.bld]&&extra.indexOf(pstate.bld)<0)pstate.bld='ct';
  var chips='<div class="chips" role="group" aria-label="Escolha o prédio">'+Object.keys(BLD).concat(extra).map(function(k){var nm=BLD[k]?BLD[k].short:plantName(plantasDe(k)[0]);return '<button class="chip" type="button" data-bld="'+esc(k)+'" aria-pressed="'+(k===pstate.bld)+'">'+esc(nm)+'</button>'}).join('')+'</div>';
  var head='<div><p class="eyebrow">Mapa interno</p><h2>Prédios por dentro</h2></div>'+chips;
  if(!BLD[pstate.bld])return head+'<p class="small"><b>'+esc(plantName(plantasDe(pstate.bld)[0]))+'</b></p>'+plantasHTML(pstate.bld);
  var B=BLD[pstate.bld],sel=PL[pstate.pl]&&PL[pstate.pl].bld===pstate.bld&&PL[pstate.pl].b?pstate.pl:null;
  return head+'<p class="small"><b>'+B.name+'</b> · <span class="muted">'+B.addr+'</span></p>'+plantasHTML(pstate.bld)+planHTML(sel)+
    '<details class="det lgabout"><summary>Sobre este esquema</summary><p class="muted small keep">'+B.note+' Planta ilustrativa: a UFRJ não publica as plantas dos prédios. Bloco, andar e número da sala são oficiais; a posição exata da sala no corredor é aproximada. Quando a fonte só dá a sala, o andar sai do número (sala 527 → 5º andar).</p></details>';
};
var _renderPredios=renderPredios;
renderPredios=function(f){_renderPredios(f);if(pPane.hidden)return;pPane.querySelectorAll('.planbox .pick .chips').forEach(function(el){var c=el.querySelector('[aria-pressed="true"]');if(c&&el.scrollWidth>el.clientWidth){var r1=el.getBoundingClientRect(),r2=c.getBoundingClientRect();el.scrollLeft+=r2.left+r2.width/2-(r1.left+r1.width/2)}})};
pPane.addEventListener('click',function(e){
  var t=e.target.closest('[data-lgo],[data-goplan],[data-lgmore]');if(!t)return;
  if(t.dataset.lgmore){pstate.more[t.dataset.lgmore]=true;renderPredios();return}
  var k=t.dataset.lgo||t.dataset.goplan,it=PL[k];if(!it)return;
  if(t.dataset.lgo){var was=pstate.pl===k&&pstate.open;pstate.open=!was;pstate.pl=k}
  if(it.bld&&BLD[it.bld]&&it.b){pstate.bld=it.bld;pstate.pf=undefined;if(it.b!=='?'){pstate.eb=it.b;pstate.ef=it.f}}
  renderPredios(t.dataset.lgo?'[data-lgo="'+k+'"]':null);
  if(t.dataset.goplan){var pb=$('#planbox');if(pb){pb.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});var f=pb.querySelector('.chip[aria-pressed="true"]');if(f)f.focus({preventScroll:true})}}
});
/* membros: registra a visita (uma escrita a cada 30 min no máximo) */
function trackMember(uid){
  if(!uid||!SH.db)return;
  var k='cse-seen-'+uid,last=0;try{last=+localStorage.getItem(k)||0}catch(e){}
  if(Date.now()-last<30*60000)return;
  SH.db.doc('members/'+uid).get().then(function(d){var x=d.exists?(d.data()||{}):{},now=Date.now();
    return SH.db.doc('members/'+uid).set({first:+x.first||now,last:now,visits:(+x.visits||0)+1});
  }).then(function(){try{localStorage.setItem(k,String(Date.now()))}catch(e){}},function(){});
}
if(!window.claude||typeof window.claude.use!=='function'){loadLocalG();if(Object.keys(GST.linhas).length||Object.keys(GST.pontos).length||Object.keys(GST.wifi).length||Object.keys(GST.servicos).length||(GST.plantas.items||[]).length)rebuildAll();setGestor('demo')}
$('#gestBtn').addEventListener('click',function(){if(gestM&&!gestM.hidden)closeGest();else openGest()});


/* ======================= conta: claude.ai ou Google (Firebase) + ajustes na nuvem ======================= */
/* No claude.ai a conta do Claude identifica a pessoa (ajustes em data/users/<id>/ajustes, privado).
   Fora dele (GitHub Pages), com js/config.js preenchido, entra com Google via Firebase Auth e guarda em Firestore usuarios/<uid>. */
var FB_CFG=window.CSE_FIREBASE||null;
var FB_ON=!!(FB_CFG&&FB_CFG.apiKey&&FB_CFG.projectId)&&!(window.claude&&typeof window.claude.use==='function');
var ACC={kind:null,uid:null,name:'',email:'',photo:'',fb:null,mute:false,t:0,last:0,state:'',busy:false};
function accSettings(){return {cfg:Object.assign({},CFG),rota:{from:state.from,to:state.to}}}
function applyRemote(d){
  if(!d||typeof d!=='object')return;
  var ch=false;
  if(d.cfg&&typeof d.cfg==='object')Object.keys(CFG).forEach(function(k){if(k in d.cfg&&typeof d.cfg[k]===typeof CFG[k]&&CFG[k]!==d.cfg[k]){CFG[k]=d.cfg[k];ch=true}});
  ACC.mute=true;
  if(ch){saveCfg();applyBg();applyCoverStyle();updateMap();drawBanner();drawShared();renderDetail();coverToday()}
  if(d.rota&&STOPS[d.rota.from]&&STOPS[d.rota.to]&&d.rota.from!==d.rota.to&&(d.rota.from!==state.from||d.rota.to!==state.to)){state.from=d.rota.from;state.to=d.rota.to;savePrefs();renderPlan();updateMap()}
  if(ACC.kind==='google'&&Array.isArray(d.grade)&&d.grade.length){GRADE=d.grade.filter(function(x){return x&&x.nome}).slice(0,40);saveGrade();syncAulas();renderGrade()}
  ACC.mute=false;
  if(!cfgM.hidden)renderCfg();
}
function accQueue(){if(!ACC.kind||ACC.mute)return;clearTimeout(ACC.t);ACC.state='salvando';accPaint();ACC.t=setTimeout(accPush,900)}
function accPush(){
  if(!ACC.kind)return;
  var s=accSettings(),p;
  if(ACC.kind==='claude')p=SH.db.doc('data/users/'+ACC.uid+'/ajustes').set({cfg:s.cfg,rota:s.rota,ts:Date.now()});
  else p=ACC.fb.db.collection('usuarios').doc(ACC.uid).set({cfg:s.cfg,rota:s.rota,grade:GRADE||[],nome:ACC.name||'',ts:Date.now()},{merge:true});
  return p.then(function(){ACC.last=Date.now();ACC.state='ok';accPaint()},function(){ACC.state='erro';accPaint()});
}
var _saveCfgA=saveCfg;saveCfg=function(){_saveCfgA();if(!ACC.mute)accQueue()};
var _savePrefsA=savePrefs;savePrefs=function(){_savePrefsA();if(!ACC.mute)accQueue()};
var _saveGradeA=saveGrade;saveGrade=function(){_saveGradeA();if(ACC.kind==='google'&&!ACC.mute)accQueue()};
/* claude.ai */
function accClaude(user,uid){
  if(!uid||!SH.db)return;
  ACC.kind='claude';ACC.uid=uid;ACC.state='carregando';
  (user?user.me():Promise.resolve({})).then(function(me){ACC.name=me&&me.name||'';ACC.photo=me&&me.avatarUrl||'';accPaint()});
  SH.db.doc('data/users/'+uid+'/ajustes').get().then(function(d){
    if(d.exists){applyRemote(d.data()||{});ACC.last=+(d.data()||{}).ts||Date.now();ACC.state='ok'}else accPush();
    accPaint();
  },function(){ACC.state='erro';accPaint()});
}
/* Google via Firebase (só fora do claude.ai, com js/config.js preenchido) */
var FBV='10.12.2';
function loadJS(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.async=true;s.onload=res;s.onerror=function(){rej(new Error('Não deu para carregar '+src))};document.head.appendChild(s)})}
function fbInit(){
  if(ACC.fb)return Promise.resolve(ACC.fb);
  var base='https://www.gstatic.com/firebasejs/'+FBV+'/';
  return loadJS(base+'firebase-app-compat.js').then(function(){return Promise.all([loadJS(base+'firebase-auth-compat.js'),loadJS(base+'firebase-firestore-compat.js')])}).then(function(){
    if(!firebase.apps.length)firebase.initializeApp(FB_CFG);
    ACC.fb={auth:firebase.auth(),db:firebase.firestore()};return ACC.fb;
  });
}
function fbMsg(e){var c=e&&e.code||'';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return '';
  if(c==='auth/unauthorized-domain')return 'Este endereço ainda não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).';
  if(c==='auth/operation-not-allowed')return 'Ative o login com Google no Firebase (Authentication › Método de login).';
  if(c==='auth/network-request-failed')return 'Sem conexão. Tente de novo.';
  return 'Não deu para entrar com Google agora.'}
function googleIn(){
  fbInit().then(function(fb){
    var pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
    return fb.auth.signInWithPopup(pr).catch(function(e){if(e&&(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'))return fb.auth.signInWithRedirect(pr);throw e});
  }).then(function(){if(!login.hidden)closeLogin()}).catch(function(e){var m=fbMsg(e);if(m)gToast(m,1)});
}
function googleOut(){if(!ACC.fb)return;ACC.fb.auth.signOut().then(function(){if(PERFIL&&PERFIL.google){PERFIL=null;savePerfil()}gToast('Você saiu da conta Google. Os ajustes continuam neste aparelho.')})}
function accGoogle(u){
  ACC.kind='google';ACC.uid=u.uid;ACC.name=u.displayName||'';ACC.email=u.email||'';ACC.photo=u.photoURL||'';ACC.state='carregando';accPaint();
  if(!PERFIL&&ACC.name){PERFIL={name:ACC.name.split(' ')[0].slice(0,24),pin:null,google:true};savePerfil();if(!login.hidden)lgShow('saved')}
  ACC.fb.db.collection('usuarios').doc(u.uid).get().then(function(d){
    if(d.exists){applyRemote(d.data()||{});ACC.last=+(d.data()||{}).ts||Date.now();ACC.state='ok';gToast('Ajustes carregados da sua conta Google.')}else accPush();
    accPaint();
  },function(){ACC.state='erro';accPaint()});
}
if(FB_ON){
  fbInit().then(function(fb){
    fb.auth.getRedirectResult().catch(function(e){var m=fbMsg(e);if(m)gToast(m,1)});
    fb.auth.onAuthStateChanged(function(u){if(u)accGoogle(u);else if(ACC.kind==='google'){ACC.kind=null;ACC.uid=null;ACC.state='';accPaint()}});
  }).catch(function(){FB_ON=false;accPaint()});
}
/* interface: Ajustes › Conta e botão no login */
function accHTML(){
  var st=ACC.state==='salvando'?'<span class="pill warn">Salvando…</span>':ACC.state==='erro'?'<span class="pill bad">Não salvou</span>':ACC.state==='carregando'?'<span class="pill">Carregando…</span>':'<span class="pill good">Sincronizado</span>';
  var av=function(){return ACC.photo?'<img class="acc-av" src="'+esc(ACC.photo)+'" alt="" referrerpolicy="no-referrer">':'<span class="acc-av">'+esc((ACC.name||'?').charAt(0).toUpperCase())+'</span>'};
  var h='<div class="accsec" id="accsec"><h2>Conta</h2>';
  if(ACC.kind==='claude')h+='<div class="acc">'+av()+'<span class="grow"><b>'+esc(ACC.name||'Você')+'</b><small>Conta do claude.ai'+(ACC.last?' · salvo '+agoTxt(ACC.last):'')+'</small></span>'+st+'</div><p class="muted small keep">Seus ajustes e o trajeto favorito ficam guardados na sua conta, só para você, e aparecem em qualquer aparelho. A grade também.</p>';
  else if(ACC.kind==='google')h+='<div class="acc">'+av()+'<span class="grow"><b>'+esc(ACC.name||'Conta Google')+'</b><small>'+esc(ACC.email)+(ACC.last?' · salvo '+agoTxt(ACC.last):'')+'</small></span>'+st+'</div><p class="muted small keep">Seus ajustes, o trajeto favorito e a grade ficam na sua conta Google e aparecem em qualquer aparelho em que você entrar.</p><button type="button" class="copy" id="accOut">Sair da conta Google</button>';
  else if(FB_ON)h+='<p class="small">Entre com a conta Google para levar seus ajustes, o trajeto favorito e a grade para qualquer aparelho.</p><button type="button" class="copy primary" data-goo>Entrar com Google</button><p class="muted small keep">Sem entrar, tudo fica salvo só neste aparelho.</p>';
  else h+='<p class="small">Seus ajustes ficam salvos só neste aparelho.</p><p class="muted small keep">Para entrar com Google, publique o app com o arquivo js/config.js preenchido (passo a passo no README do projeto). No claude.ai, a sua conta do Claude já guarda tudo.</p>';
  return h+'</div>';
}
function accPaint(){var s=$('#accsec');if(s&&!cfgM.hidden){var tmp=document.createElement('div');tmp.innerHTML=accHTML();s.replaceWith(tmp.firstChild)}}
var _renderCfgA=renderCfg;
renderCfg=function(f){_renderCfgA(f);var R=$('#cfgR');if(R&&!R.querySelector('#accsec'))R.insertAdjacentHTML('afterbegin',accHTML())};
document.querySelectorAll('#login .lg-goo').forEach(function(b){b.hidden=!FB_ON});
document.addEventListener('click',function(e){
  if(e.target.closest('[data-goo]')){e.preventDefault();googleIn();return}
  if(e.target.closest('#accOut')){googleOut()}
});
setInterval(function(){if(ACC.kind&&ACC.state==='ok')accPaint()},60000);

/* ---------- desempenho: pausa a animação das rotas quando ninguém está vendo ---------- */
(function(){
  var mw=document.querySelector('.mapwrap'),vis=true;
  function sync(){
    var ov=['#cover','#login','#pane-cfg','#glossM','#gestM','#reqM'].some(function(s){var e=$(s);return e&&!e.hidden});
    svg.classList.toggle('paused',!vis||ov||document.hidden);
  }
  if(mw&&'IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;sync()},{rootMargin:'80px'}).observe(mw);
  document.addEventListener('visibilitychange',sync);
  if('MutationObserver' in window){var mo=new MutationObserver(sync);['#cover','#login','#pane-cfg','#glossM'].forEach(function(s){var e=$(s);if(e)mo.observe(e,{attributes:true,attributeFilter:['hidden']})})}
  sync();
  /* HD em telas de alta densidade: baixa depois que a página assentou */
  var idle=window.requestIdleCallback||function(f){return setTimeout(f,1500)};
  if(!LITE)idle(function(){applyView()},{timeout:3000});
})();
drawBanner();
if(location.hash==='#siglas')setTimeout(function(){if(cover.hidden&&login.hidden)openGloss()},0);
setTab(location.hash.slice(1));
/* ---------- modo enxuto: menos texto na tela (detalhes ficam em 'Sobre' e na legenda) ---------- */
document.documentElement.dataset.density='compact';
$('#legBtn').addEventListener('click',function(){var l=$('#legend'),o=!l.classList.contains('open');l.classList.toggle('open',o);this.setAttribute('aria-expanded',String(o))});
/* ---------- capa translúcida ---------- */
var cover=$('#cover');
function coverToday(){
  var el=$('#cvToday'),t=today0(),m=mudancas().filter(function(x){var n=dDiff(dParse(x.d),t);return n>=0&&n<=7})[0];
  if(m&&CFG.coverToday){var n=dDiff(dParse(m.d),t);el.textContent=(n===0?'Hoje':n===1?'Amanhã':dTxt(m.d))+': '+(MUD_K[m.k]||'Mudança').toLowerCase()+' · '+m.t;el.hidden=false}else el.hidden=true;
}
function placeCoverMap(){
  var m=$('#cvMap'),pin=$('#cvPin');if(!m||!window.MAPHD_URL)return;
  var W=m.clientWidth,H=m.clientHeight,sh=document.querySelector('.cv-sheet'),sheetH=sh?sh.offsetHeight:0,wide=W>=700;
  var st=cover.dataset.style||'folha';
  var visH=st!=='folha'?H:(wide?H-sheetH-28:H-sheetH+30);
  // mapa nítido (campus) sobre o mapa estendido (bordas prolongadas), que garante tela cheia
  var s=wide?Math.max(1.2*W/1314,H/1300*1.02):Math.max(H/1300*1.02,visH/580*1.35,W/1314*2.4);
  var tx=815,ty=402,ox=W/2-tx*s,oy=visH*0.45-ty*s;
  var ex=-270,ey=-340,ew=2034*s,eh=1300*s;
  ox=Math.min(-ex*s,Math.max(W-(ex+2034)*s,ox));oy=Math.min(-ey*s,Math.max(H-(ey+1300)*s,oy));
  m.style.backgroundImage='url('+window.MAPHD_URL+'),url('+MAPIMG+')';
  m.style.backgroundSize=(1314*s)+'px '+(580*s)+'px,'+ew+'px '+eh+'px';
  m.style.backgroundPosition=(ox+90*s)+'px '+(oy+20*s)+'px,'+(ox+ex*s)+'px '+(oy+ey*s)+'px';
  pin.style.left=(ox+tx*s)+'px';pin.style.top=(oy+ty*s)+'px';
}
window.addEventListener('resize',function(){if(!cover.hidden)placeCoverMap()});
function openCover(){coverToday();cover.hidden=false;cover.classList.remove('closing');placeCoverMap();document.documentElement.style.overflow='hidden';var b=cover.querySelector('.cv-btn.main');if(b)b.focus({preventScroll:true})}
function closeCover(then){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  cover.classList.add('closing');
  setTimeout(function(){cover.hidden=true;document.documentElement.style.overflow='';if(then)then()},rm?0:280);
}
cover.addEventListener('click',function(e){
  var b=e.target.closest('[data-cv]');if(!b)return;var a=b.dataset.cv;
  closeCover(function(){
    if(a==='trajeto'){setTab('trajeto');try{history.replaceState(null,'','#trajeto')}catch(err){}var s=$('#to');if(s){s.scrollIntoView({block:'center'});s.focus()}}
    else if(a==='grade'||a==='cal'){setTab(a);try{history.replaceState(null,'','#'+a)}catch(err){}var pn=$('#pane-'+a);if(pn)pn.scrollIntoView({block:'start'})}
    else if(a==='noite'){$('#nightBtn').click()}
    else{var mc=document.querySelector('.mapcard');if(mc)mc.scrollIntoView({block:'start'})}
    if(a!=='trajeto'&&a!=='noite'){var t=$('#tab-'+(a==='mapa'?'trajeto':a));if(a==='mapa'){var z=$('#zin');if(z)z.focus({preventScroll:true})}else if(t)t.focus({preventScroll:true})}
  });
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!cover.hidden&&login.hidden)closeCover()});
$('#showCover').addEventListener('click',openCover);
applyCoverStyle();applyBg();
if(CFG.cover==='none'){cover.hidden=true}else{coverToday();placeCoverMap();document.documentElement.style.overflow='hidden';}

/* ---------- login: perfil salvo (protótipo; guardado só neste aparelho) ---------- */
var PERFIL=null;try{PERFIL=JSON.parse(localStorage.getItem('cse-perfil'))}catch(e){}
if(PERFIL&&!PERFIL.name)PERFIL=null;
function pinHash(s){var x=5381;for(var i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return 'h'+(x>>>0).toString(36)}
function savePerfil(){try{if(PERFIL)localStorage.setItem('cse-perfil',JSON.stringify(PERFIL));else localStorage.removeItem('cse-perfil')}catch(e){}}
var login=$('#login');
function lgShow(which){
  $('#lgSaved').hidden=which!=='saved';$('#lgNew').hidden=which!=='new';
  if(which==='saved'){$('#lgInit').textContent=PERFIL.name.charAt(0).toUpperCase();$('#lgName').textContent=PERFIL.name;
    $('#lgHint').textContent='Toque para entrar com Face ID';$('#lgBio').className='lg-bio';$('#lgPinForm').hidden=true;$('#lgUsePin').hidden=!PERFIL.pin;$('#lgPin').value='';$('#lgPinErr').textContent='';
    setTimeout(function(){$('#lgBio').focus({preventScroll:true})},50)}
  else{$('#lgNewErr').textContent='';setTimeout(function(){$('#lgNewName').focus({preventScroll:true})},50)}
}
function openLogin(){
  var bg=login.querySelector('.lg-bg');if(bg&&window.MAPHD_URL)bg.style.backgroundImage='url('+window.MAPHD_URL+')';
  login.hidden=false;login.classList.remove('closing');document.documentElement.style.overflow='hidden';
  lgShow(PERFIL?'saved':'new');
}
function closeLogin(){
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;login.classList.add('closing');
  setTimeout(function(){login.hidden=true;if(cover.hidden)document.documentElement.style.overflow='';else{var b=cover.querySelector('.cv-btn.main');if(b)b.focus({preventScroll:true})}},rm?0:300);
  if(!$('#pane-cfg').hidden)renderCfg();
}
$('#lgBio').addEventListener('click',function(){
  var b=this;if(b.classList.contains('scan')||b.classList.contains('ok'))return;
  var rm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  b.classList.add('scan');$('#lgHint').textContent='Reconhecendo…';
  setTimeout(function(){b.classList.remove('scan');b.classList.add('ok');$('#lgHint').textContent='Pronto, '+PERFIL.name+'!';setTimeout(closeLogin,rm?200:550)},rm?100:1000);
});
$('#lgUsePin').addEventListener('click',function(){this.hidden=true;$('#lgPinForm').hidden=false;$('#lgPin').focus()});
$('#lgPinForm').addEventListener('submit',function(e){e.preventDefault();
  if(pinHash($('#lgPin').value)===PERFIL.pin)closeLogin();else{$('#lgPinErr').textContent='Código errado. Tente de novo.';$('#lgPin').value='';$('#lgPin').focus()}});
$('#lgSwitch').addEventListener('click',function(){PERFIL=null;savePerfil();lgShow('new')});
$('#lgNew').addEventListener('submit',function(e){e.preventDefault();
  var n=$('#lgNewName').value.trim(),pn=$('#lgNewPin').value.trim(),er=$('#lgNewErr');
  if(!n){er.textContent='Escreva um nome.';$('#lgNewName').focus();return}
  if(pn&&!/^\d{4}$/.test(pn)){er.textContent='O código precisa ter 4 números.';$('#lgNewPin').focus();return}
  PERFIL={name:n.slice(0,24),pin:pn?pinHash(pn):null};savePerfil();lgShow('saved');$('#lgHint').textContent='Perfil criado. Toque para entrar.';
});
$('#lgSkip').addEventListener('click',closeLogin);
document.addEventListener('click',function(e){if(e.target.closest('#cfgLogout')){PERFIL=null;savePerfil();renderCfg();openLogin()}});
if(CFG.login)openLogin();

$('#rosebox').innerHTML='<svg viewBox="-72 -72 144 144">'+rose(0,0,36,NORTH+ROT)+'</svg>';
var opac=$('#opac'),opacv=$('#opacv');
function setOpac(v){v=Math.max(15,Math.min(100,+v||80));opac.value=v;opacv.textContent=v+'%';var im=$('#baseimg');window.__opac=v/100;if(im)im.style.opacity=v/100}
var savedOp=80;try{savedOp=+localStorage.getItem('cse-ufrj-opac')||80}catch(e){}
setOpac(savedOp);
opac.addEventListener('input',function(){setOpac(opac.value);try{localStorage.setItem('cse-ufrj-opac',opac.value)}catch(e){}});
renderAll();

/* Liquid Glass: brilho segue o ponteiro; refração só em navegadores Chromium */
try{if(LITE===false&&navigator.userAgentData&&navigator.userAgentData.brands&&navigator.userAgentData.brands.some(function(b){return /Chromium/.test(b.brand)}))document.documentElement.classList.add('refract')}catch(e){}
document.addEventListener('pointermove',function(e){
  var el=e.target.closest&&e.target.closest('.chip,.item,.swap,.scale button,.copy,.seg button,.zoomctl button');
  if(!el)return;var r=el.getBoundingClientRect();
  el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px');
},{passive:true});
})();
