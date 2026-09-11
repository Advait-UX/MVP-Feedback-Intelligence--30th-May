/* Shared storyline injector — wraps .app in .stage, adds James's phone, adds page-level nav pill.
   Reads per-page config from <body data-*> or the <script data-*> tag itself. */
(function(){
  function ready(fn){
    if(document.readyState!=='loading') fn();
    else document.addEventListener('DOMContentLoaded',fn);
  }
  function attr(el,name,fallback){ var v = el && el.getAttribute(name); return (v===null||v===undefined||v==='')?fallback:v; }

  ready(function(){
    var script = document.currentScript || document.querySelector('script[src*="storyline.js"]');
    var cfg = {
      step:   attr(document.body,'data-step',   attr(script,'data-step','')),
      prev:   attr(document.body,'data-prev',   attr(script,'data-prev','')),
      next:   attr(document.body,'data-next',   attr(script,'data-next','')),
      // Phone state
      mode:   attr(document.body,'data-phone-mode',   'call'),       // call | survey | ended
      name:   attr(document.body,'data-phone-name',   'NICE Support'),
      sub:    attr(document.body,'data-phone-sub',    'mobile'),
      timer:  attr(document.body,'data-phone-timer',  '00:00'),
      avatar: attr(document.body,'data-phone-avatar', 'RW'),
      ivrLbl: attr(document.body,'data-phone-ivr-label',''),
      ivrTxt: attr(document.body,'data-phone-ivr-text',''),
      ivrKey: attr(document.body,'data-phone-ivr-key',''),   // e.g. "1,2,3,4|3" — keys, then lit index
      cxReply:attr(document.body,'data-phone-customer-reply','')
    };

    // 1. Wrap .app in .stage
    var app = document.querySelector('body > .app');
    if(!app){ return; }
    var stageWrap = document.createElement('div');
    stageWrap.className = 'stage-wrap';
    var stage = document.createElement('div');
    stage.className = 'stage';
    app.parentNode.insertBefore(stageWrap, app);
    stageWrap.appendChild(stage);
    stage.appendChild(app);

    // Fluid fit: scale .stage to fit viewport width, never upscale past 1
    function fit(){
      var vw = stageWrap.clientWidth || window.innerWidth;
      var natural = 1872;
      var scale = Math.min(1, vw / natural);
      stage.style.transform = 'scale(' + scale + ')';
      stageWrap.style.height = (stage.scrollHeight * scale) + 'px';
    }
    fit();
    window.addEventListener('resize', fit);
    // Refit after layout settles (fonts, images)
    setTimeout(fit, 100);
    setTimeout(fit, 400);

    // 2. Build phone aside
    var phone = document.createElement('aside');
    phone.className = 'phone-frame';
    phone.setAttribute('aria-label','Customer view · James on mobile');

    var isCall   = cfg.mode === 'call';
    var isSurvey = cfg.mode === 'survey';
    var isEnded  = cfg.mode === 'ended';

    var avatarClass = 'rw';
    if(isSurvey) avatarClass = 'ivr';
    if(isEnded)  avatarClass = 'ended';

    var screenClass = 'phone-screen' + (isEnded?' ended':'');
    var timerClass  = 'call-timer' + (isEnded?' ended':'');
    var dotLabel    = isEnded ? 'Ended' : 'On call';

    // IVR keys hint card
    var ivrCardHTML = '';
    if(isSurvey && (cfg.ivrLbl || cfg.ivrTxt || cfg.ivrKey)){
      var keysHTML = '';
      if(cfg.ivrKey){
        var parts = cfg.ivrKey.split('|');
        var keys = parts[0].split(',');
        var lit  = parts[1] ? parts[1].trim() : '';
        keysHTML = '<div class="keys">'+ keys.map(function(k){
          k = k.trim();
          return '<span class="k'+(k===lit?' lit':'')+'">'+k+'</span>';
        }).join('') +'</div>';
      }
      ivrCardHTML =
        '<div class="ivr-card">' +
          (cfg.ivrLbl ? '<div class="lbl">'+cfg.ivrLbl+'</div>' : '') +
          (cfg.ivrTxt ? '<div class="txt">'+cfg.ivrTxt+'</div>' : '') +
          keysHTML +
        '</div>';
    }

    var endBtnHTML = isEnded
      ? '<button class="call-end redial" aria-label="Redial"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 3h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z" fill="currentColor"/></svg></button>'
      : '<button class="call-end" aria-label="End call"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M2.5 13.2a16 16 0 0 1 19 0l-2 3.5a3 3 0 0 1-2.6 1.4l-2.6-.2a2 2 0 0 1-1.7-1.5l-.4-1.8a8 8 0 0 0-3.4 0l-.4 1.8a2 2 0 0 1-1.7 1.5l-2.6.2a3 3 0 0 1-2.6-1.4z" fill="currentColor"/></svg></button>';

    phone.innerHTML =
      '<div class="phone-shell">' +
        '<div class="phone-notch"></div>' +
        '<div class="'+screenClass+'">' +
          '<div class="ph-status">' +
            '<span class="ph-time">9:13</span>' +
            '<span class="ph-icons">' +
              '<svg width="14" height="10" viewBox="0 0 14 10" fill="none"><rect x="0" y="7" width="2.4" height="3" rx=".5" fill="currentColor"/><rect x="3.4" y="5" width="2.4" height="5" rx=".5" fill="currentColor"/><rect x="6.8" y="3" width="2.4" height="7" rx=".5" fill="currentColor"/><rect x="10.2" y="0" width="2.4" height="10" rx=".5" fill="currentColor"/></svg>' +
              '<svg width="14" height="10" viewBox="0 0 24 16" fill="none"><path d="M2 8a14 14 0 0 1 20 0M5 11a10 10 0 0 1 14 0M8 14a6 6 0 0 1 8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>' +
              '<svg width="22" height="10" viewBox="0 0 26 12" fill="none"><rect x=".7" y=".7" width="21" height="10.6" rx="2.4" stroke="currentColor" stroke-width="1" fill="none" opacity=".5"/><rect x="22.5" y="3.6" width="1.6" height="4.8" rx=".4" fill="currentColor" opacity=".5"/><rect x="2.2" y="2.2" width="18" height="7.6" rx="1.4" fill="currentColor"/></svg>' +
            '</span>' +
          '</div>' +
          '<div class="call-hero">' +
            '<div class="call-name">'+cfg.name+'</div>' +
            '<div class="call-sub">'+cfg.sub+'</div>' +
            '<div class="'+timerClass+'"><span class="d"></span> '+cfg.timer+'</div>' +
            '<div class="call-avatar '+avatarClass+'"><span>'+cfg.avatar+'</span></div>' +
          '</div>' +
          ivrCardHTML +
          '<div class="call-pad">' +
            cpadHTML('mute', muteIcon()) +
            cpadHTML('keypad', keypadIcon()) +
            cpadHTML('speaker', speakerIcon(), 'active') +
            cpadHTML('add call', addCallIcon()) +
            cpadHTML('FaceTime', facetimeIcon()) +
            cpadHTML('contacts', contactsIcon()) +
          '</div>' +
          '<div class="call-end-wrap">' + endBtnHTML + '</div>' +
          '<div class="ph-home"></div>' +
        '</div>' +
      '</div>' +
      '<div class="phone-label">James Carter · iPhone 15</div>' +
      (cfg.cxReply ? '<div class="cx-reply"><div class="cx-reply-avatar">JC</div><div class="cx-reply-bubble"><span class="cx-reply-lbl">James says</span><span class="cx-reply-quote">"'+cfg.cxReply+'"</span><span class="cx-reply-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div></div>' : '');

    stage.appendChild(phone);

    // 3. Remove any existing in-page nav (.proto-nav / .nav-pill) and re-add unified one at body level
    document.querySelectorAll('.proto-nav, .nav-pill').forEach(function(n){ n.remove(); });
    if(cfg.step || cfg.prev || cfg.next){
      var nav = document.createElement('div');
      nav.className = 'nav-pill';
      nav.innerHTML =
        (cfg.prev
          ? '<a class="np" href="'+cfg.prev+'">← Back</a>'
          : '<span class="np disabled">← Back</span>') +
        (cfg.step ? '<span class="ix">'+cfg.step+'</span>' : '') +
        (cfg.next
          ? '<a class="np next" href="'+cfg.next+'">Next →</a>'
          : '<span class="np disabled" style="background:rgba(0,0,0,0.04);color:rgba(0,0,0,0.32)">Next →</span>');
      document.body.appendChild(nav);
    }
  });

  // helpers
  function cpadHTML(lab, ic, cls){
    return '<button class="cpad'+(cls?' '+cls:'')+'"><span class="ic">'+ic+'</span><span class="lab">'+lab+'</span></button>';
  }
  function muteIcon(){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="1.8"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';}
  function keypadIcon(){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><g fill="currentColor"><circle cx="6" cy="6" r="1.4"/><circle cx="12" cy="6" r="1.4"/><circle cx="18" cy="6" r="1.4"/><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/><circle cx="6" cy="18" r="1.4"/><circle cx="12" cy="18" r="1.4"/><circle cx="18" cy="18" r="1.4"/></g></svg>';}
  function speakerIcon(){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';}
  function addCallIcon(){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M19 8v6M16 11h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';}
  function facetimeIcon(){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M16 10l6-3v10l-6-3z" fill="currentColor"/></svg>';}
  function contactsIcon(){return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>';}
})();
