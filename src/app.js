// Simple interactions for the 90s portfolio desktop
// Shared responsive window helpers.
function getTaskbarHeight() {
  const value = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--startbar-height')
  );
  return Number.isFinite(value) ? value : 35;
}

function keepWindowInsideViewport(winEl) {
  if (!winEl || winEl.classList.contains('hidden') || winEl.classList.contains('fullscreen')) return;

  requestAnimationFrame(() => {
    const gap = 8;
    const taskbarHeight = getTaskbarHeight();
    const rect = winEl.getBoundingClientRect();
    const availableRight = Math.max(gap, window.innerWidth - rect.width - gap);
    const availableBottom = Math.max(gap, window.innerHeight - taskbarHeight - rect.height - gap);

    if (rect.left < gap || rect.left > availableRight || rect.top < gap || rect.top > availableBottom) {
      const nextLeft = Math.min(Math.max(gap, rect.left), availableRight);
      const nextTop = Math.min(Math.max(gap, rect.top), availableBottom);
      winEl.style.transform = 'none';
      winEl.style.left = `${nextLeft}px`;
      winEl.style.top = `${nextTop}px`;
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  const boot = document.getElementById('boot');
  const desktop = document.getElementById('desktop');
  const erFolder = document.getElementById('er-folder');
  const erWindow = document.getElementById('er-window');
  const winClose = document.getElementById('win-close');
  const tabs = document.getElementById('nav-tabs');

  // Safe openWindow: no-op when the ER window element is absent
  function openWindow(){
    if(!erWindow) return;
    erWindow.classList.remove('hidden');
    erWindow.setAttribute('aria-hidden','false');
    if(typeof addToTaskOrder === 'function') addToTaskOrder('task-er');
    if(typeof reflectTaskbar === 'function') reflectTaskbar();
  }

  // Simulate boot sequence then show an XP-like "Starting" screen with xp-logo1.png and the classic loading bar
  const xpStarting = document.getElementById('xp-starting');
  const bootLines = document.getElementById('boot-lines');
  const progress = document.querySelector('.progress');
  const prestartOverlay = document.getElementById('prestart-overlay');
  // musicWin may not exist on every page; query it to avoid ReferenceError
  const musicWin = document.getElementById('music-window');

function runBootSequence() {
  setTimeout(() => {
    if(bootLines) bootLines.classList.add('hidden');
    if(progress) progress.classList.add('hidden');
    
    if(xpStarting){
      xpStarting.classList.remove('hidden');
      xpStarting.setAttribute('aria-hidden','false');
      
      // Auto-trigger music (ensure your audio element is accessible)
      const music = document.getElementById('startup-sound'); // Use your actual ID
      if(music) music.play().catch(e => console.log("Autoplay prevented:", e));

      // Show copyright text
      const bootLeft = document.querySelector('.boot-copyright');
      const bootRight = document.querySelector('.boot-microsoft');
      if(bootLeft) bootLeft.classList.remove('hidden');
      if(bootRight) bootRight.classList.remove('hidden');
    }
  }, 3000); 
}

// After showing the XP "Starting" screen, hide the boot overlay and reveal the desktop
function finishBootSequence(){
  // show xpStarting first then reveal desktop after a short delay
  setTimeout(()=>{
    if(xpStarting){
      xpStarting.classList.add('hidden');
      xpStarting.setAttribute('aria-hidden','true');
    }
    if(boot){
      boot.classList.add('hidden');
      boot.setAttribute('aria-hidden','true');
    }
    if(desktop){
      desktop.classList.remove('hidden');
      desktop.setAttribute('aria-hidden','false');
      // Ensure the custom start/task bar is visible when the desktop appears
      const bluebar = document.querySelector('.bluebar');
      if(bluebar){
        // move the bluebar to be a direct child of <body> (prevents it from being hidden by other containers)
        try{ document.body.appendChild(bluebar); }catch(e){}
        // unhide and ensure it displays as flex
        bluebar.classList.remove('hidden');
        bluebar.style.display = 'flex';
      }
    }
  }, 2500); // allow the starting screen to be visible a moment
}

// Wire finishing to run after the runBootSequence timing
// Total: 3s -> show xpStarting, then 2.5s later reveal desktop
setTimeout(()=>{ finishBootSequence(); }, 3000 + 2500);

  // Open ER window on single OR double click (browser desktop icon)
  if(erFolder){
    erFolder.addEventListener('click',(e)=>{ openWindow(); });
    erFolder.addEventListener('dblclick',(e)=>{ openWindow(); });
  }

  // LinkedIn icon: no click animation (desktop icons animations removed)

  // Desktop icons: click animation removed (no-op handlers)
  ['recycle','my-computer','resume'].forEach(id => {
    const iconEl = document.getElementById(id);
    if(!iconEl) return;
    // keep click handlers for other behavior but do not apply visual click animation here
  });

  // My Computer window: open on click/double-click, closable and draggable
  const myComputerIcon = document.getElementById('my-computer');
  const myComputerWindow = document.getElementById('mycomputer-window');
  if(myComputerIcon){
    myComputerIcon.addEventListener('click',(e)=>{
      e.stopPropagation();
      if(myComputerWindow){
        // ensure the window isn't flush with the start bar when opened
        try{
          myComputerWindow.style.top = '6%';
        }catch(err){}
        myComputerWindow.classList.remove('hidden');
        myComputerWindow.setAttribute('aria-hidden','false');
        if(typeof addToTaskOrder==='function') addToTaskOrder('task-mycomputer');
        // ensure the visible task button exists (helper defined when myComputerWindow exists)
        if(typeof createMyComputerTaskButton === 'function') createMyComputerTaskButton();
        if(typeof reflectTaskbar==='function') reflectTaskbar();
        loadWelcomeContent();
        if(typeof resetMyComputerToWelcome === 'function') resetMyComputerToWelcome();
      }
    });
    // (double-click handler removed — single click opens the window)
  }
  if(myComputerWindow){
    const myClose = myComputerWindow.querySelector('.win-btn.close');
    // Helper: ensure a taskbar button exists for My Computer and return it
    function createMyComputerTaskButton(){
      const tabbar = document.querySelector('.tabbar');
      if(!tabbar) return null;
      let taskBtn = document.getElementById('task-mycomputer');
      if(!taskBtn){
        taskBtn = document.createElement('div');
        taskBtn.id = 'task-mycomputer';
        taskBtn.className = 'tab_container';
        taskBtn.setAttribute('role','button');
        taskBtn.setAttribute('tabindex','0');
        const img = document.createElement('img'); img.src = 'assets/mycomputer.png'; img.className = 'tab_icon'; img.alt = 'My Computer';
        const txt = document.createElement('div'); txt.className = 'tab_text'; txt.textContent = 'My Computer';
        taskBtn.appendChild(img); taskBtn.appendChild(txt);
        const restore = ()=>{
          myComputerWindow.classList.remove('hidden');
          // if window would overlap the start bar, nudge it upwards
          requestAnimationFrame(()=>{
            try{
              const startbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--startbar-height')) || 35;
              const rect = myComputerWindow.getBoundingClientRect();
                if(rect.bottom > (window.innerHeight - startbarHeight - 12)){
                myComputerWindow.style.top = '6%';
              }
            }catch(e){}
          });
          myComputerWindow.setAttribute('aria-hidden','false');
          if(typeof addToTaskOrder==='function') addToTaskOrder('task-mycomputer');
          if(typeof reflectTaskbar==='function') reflectTaskbar();
          taskBtn.classList.add('tab_container_focused'); setTimeout(()=>taskBtn.classList.remove('tab_container_focused'),120);
        };
        taskBtn.addEventListener('click', restore);
        taskBtn.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); restore(); } });
        taskBtn.addEventListener('focus', ()=>{ taskBtn.classList.add('tab_container_focused'); });
        taskBtn.addEventListener('blur', ()=>{ taskBtn.classList.remove('tab_container_focused'); });
        tabbar.appendChild(taskBtn);
      }
      taskBtn.classList.remove('hidden');
      return taskBtn;
    }
    if(myClose) myClose.addEventListener('click',()=>{
      if(typeof resetMyComputerToWelcome === 'function') resetMyComputerToWelcome();
      myComputerWindow.classList.add('hidden');
      if(typeof removeFromTaskOrder==='function') removeFromTaskOrder('task-mycomputer');
      const tb = document.getElementById('task-mycomputer'); if(tb) tb.remove();
    });
    // make draggable and ensure z-index behavior
    makeDraggable(myComputerWindow, '.titlebar');

    // maximise / minimise behavior
    const minimiseBtn = myComputerWindow.querySelector('.win-btn.minimise');
    const maximiseBtn = myComputerWindow.querySelector('.win-btn.maximise');
    if(maximiseBtn){
      maximiseBtn.addEventListener('click', ()=>{
        if(!myComputerWindow.classList.contains('fullscreen')){
          // enter fullscreen: save inline styles and add class
          const prev = { left: myComputerWindow.style.left || '', top: myComputerWindow.style.top || '', width: myComputerWindow.style.width || '', height: myComputerWindow.style.height || '' };
          try{ myComputerWindow.dataset.prevStyle = JSON.stringify(prev); }catch(e){}
          myComputerWindow.classList.add('fullscreen');
          myComputerWindow.style.left=''; myComputerWindow.style.top=''; myComputerWindow.style.width=''; myComputerWindow.style.height='';
          // swap maximise icon to resize icon (handlers read dataset for hover)
          try{ maximiseBtn.dataset.iconNormal = 'assets/resize.png'; maximiseBtn.dataset.iconHover = 'assets/resize_hover.png'; const img = maximiseBtn.querySelector('img.btn-icon'); if(img) img.src = 'assets/resize.png'; }catch(e){}
        } else {
          // exit fullscreen: restore previous inline styles
          myComputerWindow.classList.remove('fullscreen');
          try{
            const prev = myComputerWindow.dataset.prevStyle ? JSON.parse(myComputerWindow.dataset.prevStyle) : null;
            if(prev){ myComputerWindow.style.left = prev.left; myComputerWindow.style.top = prev.top; myComputerWindow.style.width = prev.width; myComputerWindow.style.height = prev.height; }
            else { myComputerWindow.style.left=''; myComputerWindow.style.top=''; myComputerWindow.style.width=''; myComputerWindow.style.height=''; }
          }catch(e){ myComputerWindow.style.left=''; myComputerWindow.style.top=''; myComputerWindow.style.width=''; myComputerWindow.style.height=''; }
          // revert maximise icon back to original
          try{ maximiseBtn.dataset.iconNormal = 'assets/maximise.png'; maximiseBtn.dataset.iconHover = 'assets/maximise_hover.png'; const img = maximiseBtn.querySelector('img.btn-icon'); if(img) img.src = 'assets/maximise.png'; }catch(e){}
        }
      });
    }
    if(minimiseBtn){
      minimiseBtn.addEventListener('click', ()=>{
        // hide the window and ensure a taskbar button is present so user can restore it
        myComputerWindow.classList.add('hidden');
        if(typeof addToTaskOrder==='function') addToTaskOrder('task-mycomputer');
        if(typeof reflectTaskbar==='function') reflectTaskbar();
        // ensure the user-visible task button exists
        createMyComputerTaskButton();
      });
    }
    // swap icon src on hover to use hover variants and ensure consistent sizing
    const btnIconSetup = (btn, normal, hover)=>{
      if(!btn) return;
      const img = btn.querySelector('img.btn-icon');
      if(!img) return;
      btn.dataset.iconNormal = normal;
      btn.dataset.iconHover = hover;
      img.src = normal;
      btn.addEventListener('mouseenter', ()=>{ img.src = btn.dataset.iconHover || hover; });
      btn.addEventListener('mouseleave', ()=>{ img.src = btn.dataset.iconNormal || normal; });
    };
    btnIconSetup(minimiseBtn, 'assets/minimise.png', 'assets/minimise_hover.png');
    btnIconSetup(maximiseBtn, 'assets/maximise.png', 'assets/maximise_hover.png');
    btnIconSetup(myClose, 'assets/close.png', 'assets/close_hover.png');
  }
  
  // Load welcome.html into the placeholder inside the winform
  function loadWelcomeContent(){
    const container = document.getElementById('welcome-container');
    if(!container) return;
    fetch('src/welcome.html', { cache: 'no-cache' })
      .then(r=>{ if(!r.ok) throw new Error('Failed to load'); return r.text() })
      .then(html=>{ container.innerHTML = html })
      .catch(err=>{ console.error('Error loading welcome content:', err); container.innerHTML = '<p style="padding:12px;color:#333">Content failed to load.</p>' });
  }

  // Tabs navigation (guard if nav-tabs was removed)
  if(tabs){
    tabs.addEventListener('click',(e)=>{
      const btn = e.target.closest('button[data-page]');
      if(!btn) return;
      [...tabs.querySelectorAll('button')].forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.dataset.page;
      [...document.querySelectorAll('.page')].forEach(p=>p.classList.add('hidden'));
      const show = document.getElementById('page-'+page);
      if(show) show.classList.remove('hidden');
    });
  }

  // Recycle bin action
  const recycle = document.getElementById('recycle');
  recycle.addEventListener('dblclick',()=>{
    alert('Recycle Bin is empty.');
  });

  // Close on Escape (guard for missing ER window)
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ if(erWindow) erWindow.classList.add('hidden'); } });

  // Taskbar / Start menu interactions
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  const clockEl = document.getElementById('taskbar-clock');
  const clockTimeEl = clockEl ? clockEl.querySelector('.clock-time') : null;
  const taskEr = document.getElementById('task-er');
  const taskMusic = document.getElementById('task-music');
  const taskbarItems = document.getElementById('taskbar-items');

  function updateClock(){
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    if(clockTimeEl){
      clockTimeEl.textContent = `${h}:${m}`;
    } else if(clockEl){
      clockEl.textContent = `${h}:${m}`;
    }
  }
  updateClock();setInterval(updateClock,60000);

  // Update time display with Manila timezone (UTC+8)
  function updateManilaTime(){
    const timeDisplay = document.querySelector('.time-display');
    if(!timeDisplay) return;
    
    // Get current UTC time and convert to Manila time (UTC+8)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const manilaTime = new Date(utcTime + (8 * 60 * 60 * 1000));
    
    // Format as 12-hour time with AM/PM
    let hours = manilaTime.getHours();
    const minutes = String(manilaTime.getMinutes()).padStart(2,'0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    timeDisplay.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateManilaTime();
  setInterval(updateManilaTime, 1000);

  if(startBtn){
    startBtn.addEventListener('click',(e)=>{
      e.stopPropagation();
      if(startMenu){ startMenu.classList.toggle('hidden'); startMenu.setAttribute('aria-hidden', startMenu.classList.contains('hidden')); }
    });
  } else {
    // fallback: listen for clicks on elements with .startbtn (in case id was not present)
    const startBtnFallback = document.querySelector('.startbtn');
    if(startBtnFallback){
      startBtnFallback.addEventListener('click',(e)=>{
        e.stopPropagation();
        if(startMenu){ startMenu.classList.toggle('hidden'); startMenu.setAttribute('aria-hidden', startMenu.classList.contains('hidden')); }
      });
    }
  }

  // Close start menu when clicking outside
  document.addEventListener('click',(e)=>{
    if(!e.target.closest('#start-menu') && !e.target.closest('#start-btn') && !e.target.closest('.startbtn')){
      if(startMenu){ startMenu.classList.add('hidden'); startMenu.setAttribute('aria-hidden', 'true'); }
    }
  });

  // Start menu navigation buttons reuse existing tab switching
  if(startMenu){
    startMenu.addEventListener('click',(e)=>{
    const btn = e.target.closest('button[data-page]');
    if(!btn) return;
    const page = btn.dataset.page;
    // open ER window and show requested page
    openWindow();
    document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
    const show = document.getElementById('page-'+page);
    if(show) show.classList.remove('hidden');
    // reflect active tab button in window nav
    document.querySelectorAll('#nav-tabs button').forEach(b=>b.classList.remove('active'));
    const tab = document.querySelector(`#nav-tabs button[data-page="${page}"]`);
    if(tab) tab.classList.add('active');
    });
  }

  // Quick-launch browser button should open the ER window on click
  const quickBrowser = document.querySelector('.quick-launch[title="Browser"]');
  if(quickBrowser){
    quickBrowser.addEventListener('click',(e)=>{
      e.preventDefault();
      openWindow();
      reflectTaskbar();
    });
  }

  // Reflect ER window in taskbar
  function reflectTaskbar(){
    // ER task
    if(taskEr){
      if(erWindow && !erWindow.classList.contains('hidden')){ taskEr.classList.remove('hidden'); taskEr.classList.add('active'); }
      else { taskEr.classList.add('hidden'); taskEr.classList.remove('active'); }
    }
    // Music task
    if(taskMusic){
      if(musicWin && !musicWin.classList.contains('hidden')){ taskMusic.classList.remove('hidden'); taskMusic.classList.add('active'); }
      else { taskMusic.classList.add('hidden'); taskMusic.classList.remove('active'); }
    }
  }
  reflectTaskbar();
  // start the boot sequence (shows the XP "Starting" screen after the initial lines)
  runBootSequence();
  // Add click/press feedback classes to interactive elements for instant tactile response (exclude desktop icons)
  document.querySelectorAll('button, .win-btn, .nav-btn, .task-item, .btn-main, .btn-small, .start-button, .quick-launch, .tab, .menu-bar span').forEach(el=>{
    if(el.closest('.gallery-slider-icon, .work-doc-item, .work-video-item')) return;
    el.classList.add('press-feedback');
  });

  // Click animation handling: apply XP-style float or zoom animations on click
  const CLICK_SELECTORS = 'button, .win-btn, .start-button, .menu-bar span, .tab, .nav-btn, .task-item, .btn-main, .btn-small, .quick-launch';
  function triggerClickAnim(e){
    if(e.target.closest('.gallery-slider-icon, .work-doc-item, .work-video-item, .winform .win-btn')) return;
    const el = e.target.closest(CLICK_SELECTORS);
    if(!el) return;
    const variant = el.dataset.clickAnim || (el.classList.contains('icon') || el.classList.contains('tab') ? 'float' : 'zoom');
    const base = 'xp-click';
    const floatClass = 'xp-click--float';
    const zoomClass = 'xp-click--zoom';
    el.classList.remove(base, floatClass, zoomClass);
    void el.offsetWidth;
    el.classList.add(base, variant === 'float' ? floatClass : zoomClass);
    function cleanup(){ el.classList.remove(base, floatClass, zoomClass); el.removeEventListener('animationend', cleanup); }
    el.addEventListener('animationend', cleanup);
  }
  document.addEventListener('click', triggerClickAnim, true);
  // Task ordering: keep first-open left, second-open right
  let taskOrder = [];
  function addToTaskOrder(id){
    if(!taskOrder.includes(id)) taskOrder.push(id);
    updateTaskPositions();
  }
  function removeFromTaskOrder(id){
    const i = taskOrder.indexOf(id);
    if(i!==-1) taskOrder.splice(i,1);
    updateTaskPositions();
  }
  function updateTaskPositions(){
    // clear classes first
    [taskEr, taskMusic].forEach(el=>{ if(el){ el.classList.remove('left','right'); } });
    if(taskOrder.length>=1){ const first = document.getElementById(taskOrder[0]); if(first) first.classList.add('left'); }
    if(taskOrder.length>=2){ const second = document.getElementById(taskOrder[1]); if(second) second.classList.add('right'); }
  }

  // ensure clicking the close (×) updates taskbar (erCloseBtn wired earlier)
  if(winClose) winClose.addEventListener('click',()=>{ removeFromTaskOrder('task-er'); reflectTaskbar(); });
  // toggle by clicking ER taskbar button
  if(taskEr){
    taskEr.addEventListener('click',()=>{
      if(!erWindow) return;
      if(erWindow.classList.contains('hidden')){ openWindow(); }
      else { erWindow.classList.add('hidden'); removeFromTaskOrder('task-er'); }
      reflectTaskbar();
    });
  }
  // toggle by clicking Music taskbar button
  if(taskMusic){
    taskMusic.addEventListener('click',()=>{
      if(!musicWin) return;
      if(musicWin.classList.contains('hidden')){ openMusicPlayer(); }
      else { closeMusicPlayer(); removeFromTaskOrder('task-music'); }
      reflectTaskbar();
    });
  }

  // Draggable windows: allow dragging by title bar for ER and Music windows
  let zIndexCounter = 2000;
  function makeDraggable(winEl, handleSelector){
    if(!winEl) return;
    const handle = winEl.querySelector(handleSelector);
    if(!handle) return;
    handle.style.cursor = 'move';
    let dragging = false;
    let startX=0, startY=0, startLeft=0, startTop=0;
    const cs = getComputedStyle(winEl);
    // ensure positioned
    if(cs.position === 'static') winEl.style.position = 'absolute';

    handle.addEventListener('mousedown',(e)=>{
      if (e.target.closest('.win-btn')) return;
      if (window.matchMedia('(max-width: 760px)').matches) return;
      // If window is fullscreen, restore previous inline styles before dragging
      if(winEl.classList.contains('fullscreen')){
        winEl.classList.remove('fullscreen');
        try{
          const prev = winEl.dataset.prevStyle ? JSON.parse(winEl.dataset.prevStyle) : null;
          if(prev){ winEl.style.left = prev.left || ''; winEl.style.top = prev.top || ''; winEl.style.width = prev.width || ''; winEl.style.height = prev.height || ''; }
          else { winEl.style.left=''; winEl.style.top=''; winEl.style.width=''; winEl.style.height=''; }
        }catch(err){ winEl.style.left=''; winEl.style.top=''; winEl.style.width=''; winEl.style.height=''; }
      }

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      // Convert the responsive centered position to explicit pixels before dragging.
      const rect = winEl.getBoundingClientRect();
      startLeft = rect.left || 0;
      startTop = rect.top || 0;
      winEl.style.transform = 'none';
      winEl.style.left = startLeft + 'px';
      winEl.style.top = startTop + 'px';
      // bring to front
      zIndexCounter += 1;
      winEl.style.zIndex = zIndexCounter;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove',(e)=>{
      if(!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      winEl.style.left = (startLeft + dx) + 'px';
      winEl.style.top = (startTop + dy) + 'px';
    });

    document.addEventListener('mouseup',()=>{
      if(dragging){ dragging = false; document.body.style.userSelect = ''; }
    });

    // touch support
    handle.addEventListener('touchstart',(e)=>{
      if (e.target.closest('.win-btn')) return;
      if (window.matchMedia('(max-width: 760px)').matches) return;
      const t = e.touches[0];
      // If window is fullscreen, restore previous inline styles before dragging
      if(winEl.classList.contains('fullscreen')){
        winEl.classList.remove('fullscreen');
        try{
          const prev = winEl.dataset.prevStyle ? JSON.parse(winEl.dataset.prevStyle) : null;
          if(prev){ winEl.style.left = prev.left || ''; winEl.style.top = prev.top || ''; winEl.style.width = prev.width || ''; winEl.style.height = prev.height || ''; }
          else { winEl.style.left=''; winEl.style.top=''; winEl.style.width=''; winEl.style.height=''; }
        }catch(err){ winEl.style.left=''; winEl.style.top=''; winEl.style.width=''; winEl.style.height=''; }
      }

      dragging = true;
      startX = t.clientX; startY = t.clientY;
      const rect = winEl.getBoundingClientRect();
      startLeft = rect.left || 0;
      startTop = rect.top || 0;
      winEl.style.transform = 'none';
      winEl.style.left = startLeft + 'px'; winEl.style.top = startTop + 'px';
      zIndexCounter += 1; winEl.style.zIndex = zIndexCounter;
      e.preventDefault();
    },{passive:false});
    document.addEventListener('touchmove',(e)=>{
      if(!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX; const dy = t.clientY - startY;
      winEl.style.left = (startLeft + dx) + 'px'; winEl.style.top = (startTop + dy) + 'px';
    },{passive:false});
    document.addEventListener('touchend',()=>{ if(dragging) dragging=false; });
  }

  // attach draggable handlers (only when elements exist)
  if(erWindow) makeDraggable(erWindow, '.titlebar');
  if(erWindow) makeDraggable(erWindow, '.title-bar');
  if(musicWin) makeDraggable(musicWin, '.titlebar');
  if(musicWin) makeDraggable(musicWin, '.title-bar');

  // Global handler for start-menu items (closes the start menu)
  window.yourFunction = function(){
    const startMenu = document.getElementById('start-menu');
    if(startMenu){ startMenu.classList.add('hidden'); startMenu.setAttribute('aria-hidden','true'); }
  };

  // Navigation for welcome/page views inside My Computer window
  let backStack = [];
  let forwardStack = [];
  let currentView = 'menu';

  function showWorkPanel(projectId){
    const work = document.getElementById('view-work');
    if(!work) return;

    const workPanels = Array.from(work.querySelectorAll('.work-panel'));
    workPanels.forEach((panel) => panel.classList.add('hidden'));

    if(!projectId || projectId === 'welcome'){
      const welcomePanel = document.getElementById('work-welcome');
      if(welcomePanel) welcomePanel.classList.remove('hidden');
      return;
    }

    const targetPanel = work.querySelector(`[data-work-panel="${projectId}"]`);
    if(targetPanel){
      targetPanel.classList.remove('hidden');
    } else {
      const welcomePanel = document.getElementById('work-welcome');
      if(welcomePanel) welcomePanel.classList.remove('hidden');
    }
  }

  function getWorkPanelLabel(projectId){
    if(projectId === 'graphics-1') return 'Youtube Thumbnails';
    if(projectId === 'graphics-social-media-post') return 'Facebook Ads';
    if(projectId === 'graphics-thumbnails') return 'Social Media Posts';
    if(projectId === 'graphics-fb-ads') return 'Banners';
    if(projectId === 'graphics-website') return 'Website UI/UX';
    if(projectId === 'graphics-others') return 'Others';
    if(projectId === 'videos-long-form') return 'Long Form';
    if(projectId === 'videos-short-form') return 'Short Form';
    if(projectId === 'videos-others') return 'Others';
    if(projectId === 'articles-1') return 'Articles';
    if(projectId === 'copywriting-emails') return 'Emails';
    if(projectId === 'copywriting-social-media-captions') return 'Social Media Captions';
    return 'My Work';
  }

  function resetMyComputerToWelcome(){
    backStack = [];
    forwardStack = [];
    renderView('menu');
  }

  function renderView(view){
    const menu = document.getElementById('view-menu');
    const about = document.getElementById('view-about');
    const work = document.getElementById('view-work');

    if(view === 'menu'){
      if(menu) menu.classList.remove('hidden');
      if(about) about.classList.add('hidden');
      if(work) work.classList.add('hidden');
    } else if(view === 'about'){
      if(menu) menu.classList.add('hidden');
      if(about) about.classList.remove('hidden');
      if(work) work.classList.add('hidden');
    } else if(view === 'work' || String(view).startsWith('work:')){
      if(menu) menu.classList.add('hidden');
      if(about) about.classList.add('hidden');
      if(work) work.classList.remove('hidden');

      if(String(view).startsWith('work:')){
        showWorkPanel(String(view).split(':')[1]);
      } else {
        showWorkPanel('welcome');
      }
    }

    currentView = view;
    // update visible nav controls and address label
    updateNavButtons();
    updateAddressLabelForView(view);
  }

  // Update the address label shown in the My Computer window's addressbar
  function updateAddressLabelForView(view){
    const addrSpan = (myComputerWindow && myComputerWindow.querySelector('.addressbar span')) || document.querySelector('.addressbar span');
    if(!addrSpan) return;
    if(view === 'menu') addrSpan.textContent = 'Main Menu';
    else if(view === 'about') addrSpan.textContent = 'About Me';
    else if(view === 'work') addrSpan.textContent = 'My Work';
    else if(String(view).startsWith('work:')) addrSpan.textContent = getWorkPanelLabel(String(view).split(':')[1]);
  }

  function updateNavButtons(){
    if(!myComputerWindow) return;
    const backBtn = myComputerWindow.querySelector('.back_enabled, .back_disabled');
    const forwardBtn = myComputerWindow.querySelector('.forward');
    if(backBtn){
      if(backStack.length === 0){ backBtn.classList.remove('back_enabled'); backBtn.classList.add('back_disabled'); backBtn.style.cursor = 'default'; }
      else { backBtn.classList.remove('back_disabled'); backBtn.classList.add('back_enabled'); backBtn.style.cursor = 'pointer'; }
    }
    if(forwardBtn){
      if(forwardStack.length === 0){ forwardBtn.classList.remove('forward_enabled'); forwardBtn.classList.add('forward_disabled'); forwardBtn.style.cursor = 'default'; }
      else { forwardBtn.classList.remove('forward_disabled'); forwardBtn.classList.add('forward_enabled'); forwardBtn.style.cursor = 'pointer'; }
    }
  }

  function navigateTo(view){
    if(view === currentView) return;
    backStack.push(currentView);
    forwardStack = [];
    renderView(view);
  }

  // Exposed helper to open the Work section from other UI (e.g., Start menu or links)
  function openWorkSection(){
    const mainMenu = document.getElementById('main-menu');
    if(mainMenu) mainMenu.classList.add('hidden');

    const workView = document.getElementById('view-work');
    if(workView) workView.classList.remove('hidden');

    const addressInput = document.getElementById('address-input');
    if(addressInput) addressInput.value = "C:\\My Work";

    // Ensure My Computer window is visible and navigated to the work view
    if(myComputerWindow){ myComputerWindow.classList.remove('hidden'); myComputerWindow.setAttribute('aria-hidden','false'); if(typeof addToTaskOrder === 'function') addToTaskOrder('task-mycomputer'); if(typeof createMyComputerTaskButton === 'function') createMyComputerTaskButton(); if(typeof reflectTaskbar === 'function') reflectTaskbar(); }
    // keep navigation state in our view stack
    navigateTo('work');
  }
  // make globally callable
  window.openWorkSection = openWorkSection;

  // Wire the About button (removed inline onclick in index.html)
  const welcomeToggleBtn = document.getElementById('welcome-toggle-about');
  if (welcomeToggleBtn) welcomeToggleBtn.addEventListener('click', (e)=>{
    if(e && typeof e.preventDefault === 'function') e.preventDefault();
    if(myComputerWindow){
      myComputerWindow.classList.remove('hidden');
      myComputerWindow.setAttribute('aria-hidden','false');
      if(typeof addToTaskOrder==='function') addToTaskOrder('task-mycomputer');
      if(typeof createMyComputerTaskButton === 'function') createMyComputerTaskButton();
      if(typeof reflectTaskbar==='function') reflectTaskbar();
      loadWelcomeContent();
    }
    navigateTo('about');
  });

  // Wire the My Work button
  const welcomeToggleWorkBtn = document.getElementById('welcome-toggle-work');
  if (welcomeToggleWorkBtn) welcomeToggleWorkBtn.addEventListener('click', (e)=>{
    if(e && typeof e.preventDefault === 'function') e.preventDefault();
    if(myComputerWindow){
      myComputerWindow.classList.remove('hidden');
      myComputerWindow.setAttribute('aria-hidden','false');
      if(typeof addToTaskOrder==='function') addToTaskOrder('task-mycomputer');
      if(typeof createMyComputerTaskButton === 'function') createMyComputerTaskButton();
      if(typeof reflectTaskbar==='function') reflectTaskbar();
    }
    navigateTo('work');
  });

  // Wire the My Work project items into the same Back/Forward history.
  // Example: My Work -> Graphics Projects -> Back returns to My Work welcome -> Back returns to Main Menu.
  const workProjectItems = Array.from(document.querySelectorAll('#view-work .accordion_content_item[data-project]'));
  workProjectItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const projectId = item.dataset.project;
      if(!projectId) return;
      navigateTo(`work:${projectId}`);
    });
  });

  // Clicking other menu items should update the address label to show the selected item
  const welcomeContent = document.querySelector('.welcome-main .content');
  if(welcomeContent){
    welcomeContent.addEventListener('click', (e)=>{
      const item = e.target.closest('.menu-item');
      if(!item) return;
      const addrSpan = (myComputerWindow && myComputerWindow.querySelector('.addressbar span')) || document.querySelector('.addressbar span');
      if(!addrSpan) return;
      // Use the visible text of the menu item (icons included)
      const text = item.innerText.trim();
      if(text) addrSpan.textContent = text;
    });
  }

  // Back/Forward handlers
  if(myComputerWindow){
    const backBtn = myComputerWindow.querySelector('.back_enabled, .back_disabled');
    const forwardBtn = myComputerWindow.querySelector('.forward');
    if(backBtn){
      backBtn.addEventListener('click',(ev)=>{
        ev.preventDefault();
        if(backStack.length === 0) return;
        forwardStack.push(currentView);
        const prev = backStack.pop();
        renderView(prev);
      });
    }
    if(forwardBtn){
      forwardBtn.addEventListener('click',(ev)=>{
        ev.preventDefault();
        if(forwardStack.length === 0) return;
        backStack.push(currentView);
        const next = forwardStack.pop();
        renderView(next);
      });
    }
    // initial state
    renderView('menu');
  }



  // Profile photo carousel for About Me
  function initProfilePhotoCarousel() {
    const carousel = document.getElementById('profilePhotoCarousel');
    const track = document.getElementById('profilePhotoTrack');
    if (!carousel || !track || carousel.dataset.ready === 'true') return;

    const slides = Array.from(carousel.querySelectorAll('.profile-photo-slide'));
    const dots = Array.from(carousel.querySelectorAll('.profile-photo-dot'));
    if (!slides.length || !dots.length) return;

    carousel.dataset.ready = 'true';

    let current = 0;
    let startX = 0;
    let endX = 0;
    let moved = false;
    let timer = null;

    function update() {
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((slide, index) => slide.classList.toggle('active', index === current));
      dots.forEach((dot, index) => dot.classList.toggle('active', index === current));
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      update();
      restartAuto();
    }

    function next() {
      goTo(current + 1);
    }

    function previous() {
      goTo(current - 1);
    }

    function startAuto() {
      timer = setInterval(next, 4000);
    }

    function restartAuto() {
      if (timer) clearInterval(timer);
      startAuto();
    }

    function handleSwipe() {
      const distance = endX - startX;
      if (distance > 50) previous();
      else if (distance < -50) next();
    }

    carousel.addEventListener('click', (e) => {
      if (e.target.closest('.profile-photo-dot')) return;
      if (moved) return;
      next();
    });

    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      moved = false;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      if (Math.abs(e.touches[0].clientX - startX) > 8) moved = true;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      handleSwipe();
      setTimeout(() => { moved = false; }, 0);
    });

    carousel.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      moved = false;
    });

    carousel.addEventListener('mousemove', (e) => {
      if (Math.abs(e.clientX - startX) > 8) moved = true;
    });

    carousel.addEventListener('mouseup', (e) => {
      endX = e.clientX;
      handleSwipe();
      setTimeout(() => { moved = false; }, 0);
    });

    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = Number(dot.dataset.profilePhotoIndex);
        if (!Number.isNaN(index)) goTo(index);
      });
    });

    update();
    startAuto();
  }

  initProfilePhotoCarousel();

  // Mailto handler: prompt and open Gmail in browser when confirmed
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href^="mailto:"]');
    if(!a) return;
    const mailto = a.getAttribute('href');
    if(!mailto) return;
    // Prevent the default mailto so we can control behavior
    e.preventDefault();
    const to = mailto.replace(/^mailto:/i, '');
    const proceed = confirm('Open Gmail in your browser to compose an email to ' + to + '?');
    if(proceed){
      const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to);
      window.open(gmailUrl, '_blank');
    }
    // If user cancels, do nothing (stay on page)
  });
});

function showView(viewId) {
    // 1. Hide all possible views
    const views = ['view-menu', 'view-about', 'view-work'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // 2. Show the requested view
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
    }
}

// Attach these to your clicks
document.getElementById('welcome-toggle-work').addEventListener('click', (e) => {
    e.preventDefault();
    showView('view-work');
});

document.getElementById('welcome-toggle-about').addEventListener('click', (e) => {
    e.preventDefault();
    showView('view-about');
});

/* ============================================================
   CONTACT ME WINDOW BEHAVIOR
   - Fullscreen minimise/close now work reliably.
   - Taskbar restoration preserves the current window state.
   - Window controls are excluded from the fade-out click animation.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const contactIcon = document.getElementById('contact-me');
  const contactWindow = document.getElementById('contact-window');
  const startMenu = document.getElementById('start-menu');

  if (!contactWindow) return;

  let contactZIndex = 4600;

  function bringContactToFront() {
    contactZIndex = Math.min(contactZIndex + 1, 19000);
    contactWindow.style.zIndex = String(contactZIndex);
  }

  const closeBtn = contactWindow.querySelector('.win-btn.close');
  const minimiseBtn = contactWindow.querySelector('.win-btn.minimise');
  const maximiseBtn = contactWindow.querySelector('.win-btn.maximise');

  function setMaximiseIcon() {
    if (!maximiseBtn) return;
    const img = maximiseBtn.querySelector('img.btn-icon');
    if (!img) return;

    const fullscreen = contactWindow.classList.contains('fullscreen');
    maximiseBtn.dataset.iconNormal = fullscreen ? 'assets/resize.png' : 'assets/maximise.png';
    maximiseBtn.dataset.iconHover = fullscreen ? 'assets/resize_hover.png' : 'assets/maximise_hover.png';
    img.src = maximiseBtn.dataset.iconNormal;
    maximiseBtn.setAttribute('aria-label', fullscreen ? 'Restore' : 'Maximise');
    maximiseBtn.title = fullscreen ? 'Restore' : 'Maximise';
  }

  function restoreContactGeometry() {
    contactWindow.classList.remove('fullscreen');

    try {
      const prev = contactWindow.dataset.prevStyle
        ? JSON.parse(contactWindow.dataset.prevStyle)
        : null;

      if (prev) {
        contactWindow.style.left = prev.left || '';
        contactWindow.style.top = prev.top || '';
        contactWindow.style.width = prev.width || '';
        contactWindow.style.height = prev.height || '';
        contactWindow.style.transform = prev.transform || '';
      } else {
        contactWindow.style.left = '';
        contactWindow.style.top = '';
        contactWindow.style.width = '';
        contactWindow.style.height = '';
        contactWindow.style.transform = '';
      }
    } catch (error) {
      contactWindow.style.left = '';
      contactWindow.style.top = '';
      contactWindow.style.width = '';
      contactWindow.style.height = '';
      contactWindow.style.transform = '';
    }

    setMaximiseIcon();
  }

  function createContactTaskButton() {
    const tabbar = document.querySelector('.tabbar');
    if (!tabbar) return null;

    let taskBtn = document.getElementById('task-contact');
    if (!taskBtn) {
      taskBtn = document.createElement('div');
      taskBtn.id = 'task-contact';
      taskBtn.className = 'tab_container';
      taskBtn.setAttribute('role', 'button');
      taskBtn.setAttribute('tabindex', '0');
      taskBtn.setAttribute('aria-label', 'Restore Contact Me');

      const img = document.createElement('img');
      img.src = 'assets/outlook.png';
      img.className = 'tab_icon';
      img.alt = 'Contact Me';

      const txt = document.createElement('div');
      txt.className = 'tab_text';
      txt.textContent = 'Contact Me';

      taskBtn.appendChild(img);
      taskBtn.appendChild(txt);

      const restore = () => {
        contactWindow.classList.remove('hidden');
        contactWindow.setAttribute('aria-hidden', 'false');
        bringContactToFront();
        setMaximiseIcon();
        keepWindowInsideViewport(contactWindow);
        taskBtn.classList.add('tab_container_focused');
        setTimeout(() => taskBtn.classList.remove('tab_container_focused'), 120);
      };

      taskBtn.addEventListener('click', restore);
      taskBtn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          restore();
        }
      });

      tabbar.appendChild(taskBtn);
    }

    taskBtn.classList.remove('hidden');
    return taskBtn;
  }

  function openContactWindow() {
    if (!contactWindow.dataset.openedOnce) {
      // Let the responsive CSS center and size the window on first open.
      contactWindow.style.left = '';
      contactWindow.style.top = '';
      contactWindow.style.width = '';
      contactWindow.style.height = '';
      contactWindow.style.transform = '';
      contactWindow.dataset.openedOnce = 'true';
    }

    contactWindow.classList.remove('hidden');
    contactWindow.setAttribute('aria-hidden', 'false');
    bringContactToFront();
    createContactTaskButton();
    setMaximiseIcon();
    keepWindowInsideViewport(contactWindow);
  }

  function minimiseContactWindow(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Keep the fullscreen state so the taskbar button restores it maximized.
    contactWindow.classList.add('hidden');
    contactWindow.setAttribute('aria-hidden', 'true');
    createContactTaskButton();
  }

  function closeContactWindow(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    restoreContactGeometry();
    contactWindow.classList.add('hidden');
    contactWindow.setAttribute('aria-hidden', 'true');

    const taskBtn = document.getElementById('task-contact');
    if (taskBtn) taskBtn.remove();
  }

  function toggleContactMaximise(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!contactWindow.classList.contains('fullscreen')) {
      const prev = {
        left: contactWindow.style.left || '',
        top: contactWindow.style.top || '',
        width: contactWindow.style.width || '',
        height: contactWindow.style.height || '',
        transform: contactWindow.style.transform || ''
      };

      try {
        contactWindow.dataset.prevStyle = JSON.stringify(prev);
      } catch (error) {}

      contactWindow.classList.add('fullscreen');
      contactWindow.style.left = '';
      contactWindow.style.top = '';
      contactWindow.style.width = '';
      contactWindow.style.height = '';
      contactWindow.style.transform = '';
    } else {
      restoreContactGeometry();
    }

    setMaximiseIcon();
    bringContactToFront();
  }

  window.openContactWindow = openContactWindow;

  if (contactIcon) {
    contactIcon.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openContactWindow();
    });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest(
      '#welcome-open-contact, #start-open-contact, #contact-me, [data-open-contact-window="true"]'
    );

    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    openContactWindow();

    if (trigger.id === 'start-open-contact' || trigger.closest('#start-menu')) {
      if (typeof window.yourFunction === 'function') {
        window.yourFunction();
      } else if (startMenu) {
        startMenu.classList.add('hidden');
        startMenu.setAttribute('aria-hidden', 'true');
      }
    }
  }, true);

  contactWindow.addEventListener('mousedown', bringContactToFront);
  contactWindow.addEventListener('touchstart', bringContactToFront, { passive: true });

  if (closeBtn) closeBtn.addEventListener('click', closeContactWindow);
  if (minimiseBtn) minimiseBtn.addEventListener('click', minimiseContactWindow);
  if (maximiseBtn) maximiseBtn.addEventListener('click', toggleContactMaximise);

  function setupButtonIconHover(btn, normal, hover) {
    if (!btn) return;
    const img = btn.querySelector('img.btn-icon');
    if (!img) return;

    btn.dataset.iconNormal = normal;
    btn.dataset.iconHover = hover;
    img.src = normal;

    btn.addEventListener('mouseenter', () => {
      img.src = btn.dataset.iconHover || hover;
    });

    btn.addEventListener('mouseleave', () => {
      img.src = btn.dataset.iconNormal || normal;
    });
  }

  setupButtonIconHover(minimiseBtn, 'assets/minimise.png', 'assets/minimise_hover.png');
  setupButtonIconHover(maximiseBtn, 'assets/maximise.png', 'assets/maximise_hover.png');
  setupButtonIconHover(closeBtn, 'assets/close.png', 'assets/close_hover.png');
  setMaximiseIcon();

  function makeContactDraggable() {
    const handle = contactWindow.querySelector('.titlebar');
    if (!handle) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function beginDrag(clientX, clientY) {
      if (contactWindow.classList.contains('fullscreen')) return;

      dragging = true;
      startX = clientX;
      startY = clientY;

      const rect = contactWindow.getBoundingClientRect();
      startLeft = rect.left || 0;
      startTop = rect.top || 0;

      contactWindow.style.transform = 'none';
      contactWindow.style.left = `${startLeft}px`;
      contactWindow.style.top = `${startTop}px`;
      bringContactToFront();
      document.body.style.userSelect = 'none';
    }

    handle.addEventListener('mousedown', (event) => {
      if (event.target.closest('.win-btn')) return;
      beginDrag(event.clientX, event.clientY);
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      const taskbarHeight = getTaskbarHeight();
      const rect = contactWindow.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - taskbarHeight - rect.height - 8);
      const nextLeft = Math.min(Math.max(8, startLeft + event.clientX - startX), maxLeft);
      const nextTop = Math.min(Math.max(8, startTop + event.clientY - startY), maxTop);
      contactWindow.style.left = `${nextLeft}px`;
      contactWindow.style.top = `${nextTop}px`;
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
    });

    handle.addEventListener('touchstart', (event) => {
      if (event.target.closest('.win-btn')) return;
      const touch = event.touches[0];
      beginDrag(touch.clientX, touch.clientY);
      event.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
      if (!dragging) return;
      const touch = event.touches[0];
      const taskbarHeight = getTaskbarHeight();
      const rect = contactWindow.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - taskbarHeight - rect.height - 8);
      const nextLeft = Math.min(Math.max(8, startLeft + touch.clientX - startX), maxLeft);
      const nextTop = Math.min(Math.max(8, startTop + touch.clientY - startY), maxTop);
      contactWindow.style.left = `${nextLeft}px`;
      contactWindow.style.top = `${nextTop}px`;
      event.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', () => {
      dragging = false;
      document.body.style.userSelect = '';
    });
  }

  makeContactDraggable();

  const contactComposeForm = document.getElementById('contact-compose-form');
  const contactSendBtn = document.getElementById('contact-send-btn');
  const contactEmailInput = document.getElementById('contact-email-input');
  const contactSubjectInput = document.getElementById('contact-subject-input');
  const contactMessageInput = document.getElementById('contact-message-input');
  const contactCheckBtn = document.getElementById('contact-check-btn');
  const contactSpellingBtn = document.getElementById('contact-spelling-btn');

  function isValidContactEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function updateMessageToolState() {
    const hasMessage = Boolean(contactMessageInput && contactMessageInput.value.trim().length > 0);

    [contactSendBtn, contactCheckBtn, contactSpellingBtn].forEach((button) => {
      if (!button) return;
      button.classList.toggle('contact-message-dependent-disabled', !hasMessage);
      button.classList.toggle('contact-message-dependent-active', hasMessage);
    });

    [contactCheckBtn, contactSpellingBtn].forEach((button) => {
      if (!button) return;
      button.setAttribute('aria-disabled', String(!hasMessage));
    });
  }

  function updateContactSendState() {
    if (!contactSendBtn || !contactEmailInput || !contactSubjectInput || !contactMessageInput) return;

    const ready =
      isValidContactEmail(contactEmailInput.value) &&
      contactSubjectInput.value.trim().length > 0 &&
      contactMessageInput.value.trim().length > 0;

    const hasMessage = contactMessageInput.value.trim().length > 0;
    contactSendBtn.classList.toggle('contact-toolbar-button-disabled', !hasMessage);
    contactSendBtn.setAttribute('aria-disabled', String(!ready));
  }

  [contactEmailInput, contactSubjectInput, contactMessageInput].forEach((field) => {
    if (!field) return;
    field.addEventListener('input', () => {
      updateContactSendState();
      updateMessageToolState();
    });
  });

  if (contactComposeForm) {
    contactComposeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (contactSendBtn) contactSendBtn.click();
    });
  }

  if (contactSendBtn) {
    contactSendBtn.addEventListener('click', () => {
      updateContactSendState();

      if (contactSendBtn.getAttribute('aria-disabled') === 'true') {
        alert('Please complete your email, subject, and message before sending.');
        return;
      }

      const fromEmail = contactEmailInput ? contactEmailInput.value.trim() : '';
      const subject = contactSubjectInput ? contactSubjectInput.value.trim() : '';
      const message = contactMessageInput ? contactMessageInput.value.trim() : '';

      if (!isValidContactEmail(fromEmail)) {
        alert('Please enter a valid email address.');
        return;
      }

      if (typeof emailjs === 'undefined') {
        alert('The email service is unavailable. Please refresh the page and try again.');
        return;
      }

      contactSendBtn.disabled = true;
      const originalText = contactSendBtn.innerHTML;
      contactSendBtn.innerHTML = '<img class="contact-send-icon" alt="send" width="40" height="30" src="assets/sendmail.png" /><p>Sending...</p>';

      const sentTime = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date());

      emailjs.send(
        'service_ufnjcsb',
        'template_batg7sj',
        {
          // These names must exactly match the EmailJS template variables:
          // {{name}}, {{email}}, {{subject}}, {{title}}, {{message}}, and {{time}}
          name: fromEmail,
          email: fromEmail,
          subject: subject,
          title: subject,
          message: message,
          time: sentTime
        },
        {
          publicKey: 'iIQ5ZH0pF_Gk6nJzK'
        }
      ).then(() => {
        alert('Message sent successfully!');

        if (contactEmailInput) contactEmailInput.value = '';
        if (contactSubjectInput) contactSubjectInput.value = '';
        if (contactMessageInput) contactMessageInput.value = '';

        contactSendBtn.disabled = false;
        contactSendBtn.innerHTML = originalText;
        updateContactSendState();
        updateMessageToolState();
      }).catch((error) => {
        console.error('EmailJS error:', error);

        const status = error && error.status ? error.status : 'Unknown status';
        const details =
          error && (error.text || error.message)
            ? (error.text || error.message)
            : 'Unknown EmailJS error';

        alert(`EmailJS failed (${status}): ${details}`);

        contactSendBtn.disabled = false;
        contactSendBtn.innerHTML = originalText;
        updateContactSendState();
        updateMessageToolState();
      });
    });
  }

  try {
    if (typeof emailjs !== 'undefined') {
      emailjs.init({ publicKey: 'iIQ5ZH0pF_Gk6nJzK' });
    }
  } catch (error) {
    console.error('EmailJS initialization failed:', error);
  }

  const contactTextControls = {
    'contact-cut-btn': 'cut',
    'contact-copy-btn': 'copy',
    'contact-paste-btn': 'paste',
    'contact-undo-btn': 'undo'
  };

  Object.entries(contactTextControls).forEach(([buttonId, command]) => {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.addEventListener('click', () => {
      const active = document.activeElement;
      const editable = active && ['INPUT', 'TEXTAREA'].includes(active.tagName);
      if (editable) document.execCommand(command);
    });
  });

  if (contactCheckBtn) {
    contactCheckBtn.addEventListener('click', () => {
      updateMessageToolState();
      updateContactSendState();

      if (contactCheckBtn.getAttribute('aria-disabled') === 'true') {
        alert('Please type a message before using Check.');
        return;
      }

      alert(contactSendBtn && contactSendBtn.getAttribute('aria-disabled') === 'false'
        ? 'Message looks ready to send.'
        : 'Message has content. Please complete your email and subject before sending.');
    });
  }

  if (contactSpellingBtn) {
    contactSpellingBtn.addEventListener('click', () => {
      updateMessageToolState();

      if (contactSpellingBtn.getAttribute('aria-disabled') === 'true') {
        alert('Please type a message before using Spelling.');
        return;
      }

      if (contactMessageInput) {
        contactMessageInput.focus();
        alert('Browser spellcheck is available while typing in the message box.');
      }
    });
  }

  updateContactSendState();
  updateMessageToolState();
});

/* ============================================================
   WORK DETAIL GALLERY PANEL BEHAVIOR
   Enables thumbnail selection, previous/next controls,
   and optional redirect links for selected gallery items.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const galleries = Array.from(document.querySelectorAll('#view-work .work-gallery'));

  galleries.forEach((gallery) => {
    if (gallery.dataset.galleryReady === 'true') return;
    gallery.dataset.galleryReady = 'true';

    const activeImage = gallery.querySelector('.work-gallery-active-image');
    const thumbnails = Array.from(gallery.querySelectorAll('.gallery-slider-icon'));
    const previousButton = gallery.querySelector('.work-gallery-prev');
    const nextButton = gallery.querySelector('.work-gallery-next');

    if (!activeImage || thumbnails.length === 0) return;

    let currentIndex = Math.max(
      0,
      thumbnails.findIndex((button) => button.classList.contains('active'))
    );

    function showImage(index) {
      currentIndex = (index + thumbnails.length) % thumbnails.length;
      const selected = thumbnails[currentIndex];
      const selectedImage = selected.querySelector('img');

      activeImage.src =
        selected.dataset.gallerySrc ||
        (selectedImage ? selectedImage.src : activeImage.src);

      activeImage.alt =
        selected.dataset.galleryAlt ||
        (selectedImage ? selectedImage.alt : activeImage.alt);

      activeImage.dataset.galleryLink = selected.dataset.galleryLink || '';
      activeImage.dataset.galleryFilename = selected.dataset.galleryFilename || '';

      if (selected.dataset.galleryLink && selected.dataset.galleryLink.trim() !== '') {
        activeImage.style.cursor = 'pointer';
        activeImage.title = 'Open project link';
      } else {
        activeImage.style.cursor = 'default';
        activeImage.removeAttribute('title');
      }

      thumbnails.forEach((button, buttonIndex) => {
        button.classList.toggle('active', buttonIndex === currentIndex);
      });
    }

    thumbnails.forEach((button, index) => {
      button.addEventListener('click', () => {
        showImage(index);

        const link = button.dataset.galleryLink;

        if (link && link.trim() !== '') {
          window.open(link, '_blank', 'noopener,noreferrer');
        }
      });
    });

    activeImage.addEventListener('click', () => {
      const link = activeImage.dataset.galleryLink;

      if (link && link.trim() !== '') {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    });

    if (previousButton) {
      previousButton.addEventListener('click', () => showImage(currentIndex - 1));
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => showImage(currentIndex + 1));
    }

    showImage(currentIndex);
  });
});


/* ============================================================
   LINKED VIDEO + COPYWRITING PORTFOLIO ITEMS
   Opens video project URLs and local public-folder files when
   Long Form, Short Form, Articles, Emails, or Social Media items
   are clicked.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const linkedItems = Array.from(document.querySelectorAll(
    '#view-work .work-video-item[data-project-link], #view-work .work-doc-item[data-project-link]'
  ));

  if (!linkedItems.length) return;

  linkedItems.forEach((item) => {
    item.title = 'Open project';

    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const link = (item.dataset.projectLink || '').trim();

      if (!link) {
        alert('Project link is not yet set.');
        return;
      }

      window.open(link, '_blank', 'noopener,noreferrer');
    });
  });
});

/* ============================================================
   TETRIS DESKTOP ICON + WINDOW + GAME
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const tetrisIcon = document.getElementById('tetris');
  const tetrisWindow = document.getElementById('tetris-window');
  const canvas = document.getElementById('tetris-canvas');

  if (!tetrisIcon || !tetrisWindow || !canvas) return;

  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('tetris-score');
  const rankListEl = document.getElementById('tetris-rank-list');
  const gameOverEl = document.getElementById('tetris-game-over');
  const finalScoreEl = document.getElementById('tetris-final-score');
  const playAgainBtn = document.getElementById('tetris-play-again');
  const quitBtn = document.getElementById('tetris-quit-game');
  const leftBtn = document.getElementById('tetris-left');
  const rightBtn = document.getElementById('tetris-right');
  const rotateBtn = document.getElementById('tetris-rotate');
  const dropBtn = document.getElementById('tetris-drop');
  const pauseBtn = document.getElementById('tetris-pause');
  const newGameBtn = document.getElementById('tetris-new-game');

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 24;
  const HIGH_SCORE_KEY = 'portfolioTetrisHighScores';

  canvas.width = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;

  const colors = {
    I: '#00e5ff',
    J: '#3b82f6',
    L: '#f59e0b',
    O: '#facc15',
    S: '#22c55e',
    T: '#a855f7',
    Z: '#ef4444'
  };

  const pieces = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
    O: [[1,1],[1,1]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]]
  };

  let board = createBoard();
  let currentPiece = null;
  let score = 0;
  let dropCounter = 0;
  let dropInterval = 720;
  let lastTime = 0;
  let animationFrameId = null;
  let isGameOver = false;
  let isPaused = false;
  let tetrisZIndex = 4700;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function playToneSequence(type) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const notes = type === 'open'
        ? [{ f: 523, t: 0 }, { f: 659, t: 0.08 }, { f: 784, t: 0.16 }]
        : [{ f: 220, t: 0 }, { f: 165, t: 0.12 }, { f: 110, t: 0.24 }];

      notes.forEach((note) => {
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = type === 'open' ? 'square' : 'sawtooth';
        oscillator.frequency.setValueAtTime(note.f, audioCtx.currentTime + note.t);
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime + note.t);
        gain.gain.exponentialRampToValueAtTime(0.16, audioCtx.currentTime + note.t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + note.t + 0.18);
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime + note.t);
        oscillator.stop(audioCtx.currentTime + note.t + 0.2);
      });

      setTimeout(() => audioCtx.close().catch(() => {}), 900);
    } catch (err) {
      // Sound is optional. Ignore browser audio restrictions.
    }
  }

  function getHighScores() {
    try {
      const scores = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) || '[]');
      return Array.isArray(scores) ? scores.filter(Number.isFinite).slice(0, 5) : [];
    } catch (err) {
      return [];
    }
  }

  function saveHighScore(newScore) {
    const scores = getHighScores();
    scores.push(newScore);
    scores.sort((a, b) => b - a);
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores.slice(0, 5)));
  }

  function renderHighScores() {
    if (!rankListEl) return;
    const scores = getHighScores();
    rankListEl.innerHTML = '';
    for (let i = 0; i < 5; i += 1) {
      const li = document.createElement('li');
      li.textContent = String(scores[i] || 0);
      rankListEl.appendChild(li);
    }
  }

  function randomPiece() {
    const keys = Object.keys(pieces);
    const type = keys[Math.floor(Math.random() * keys.length)];
    return {
      type,
      matrix: pieces[type].map(row => row.slice()),
      x: Math.floor(COLS / 2) - Math.ceil(pieces[type][0].length / 2),
      y: 0
    };
  }

  function collides(piece, offsetX = 0, offsetY = 0, matrix = piece.matrix) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue;
        const boardX = piece.x + x + offsetX;
        const boardY = piece.y + y + offsetY;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
        if (boardY >= 0 && board[boardY][boardX]) return true;
      }
    }
    return false;
  }

  function mergePiece() {
    currentPiece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            board[boardY][boardX] = currentPiece.type;
          }
        }
      });
    });
  }

  function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y -= 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!board[y][x]) continue outer;
      }
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      linesCleared += 1;
      y += 1;
    }

    if (linesCleared > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      score += lineScores[linesCleared] || linesCleared * 250;
      dropInterval = Math.max(180, dropInterval - linesCleared * 18);
      updateScore();
    }
  }

  function updateScore() {
    if (scoreEl) scoreEl.textContent = String(score);
  }

  function rotateMatrix(matrix) {
    return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
  }

  function rotatePiece() {
    if (!currentPiece || isGameOver || isPaused) return;
    const rotated = rotateMatrix(currentPiece.matrix);
    if (!collides(currentPiece, 0, 0, rotated)) {
      currentPiece.matrix = rotated;
      draw();
      return;
    }
    if (!collides(currentPiece, -1, 0, rotated)) {
      currentPiece.x -= 1;
      currentPiece.matrix = rotated;
      draw();
      return;
    }
    if (!collides(currentPiece, 1, 0, rotated)) {
      currentPiece.x += 1;
      currentPiece.matrix = rotated;
      draw();
    }
  }

  function movePiece(direction) {
    if (!currentPiece || isGameOver || isPaused) return;
    if (!collides(currentPiece, direction, 0)) {
      currentPiece.x += direction;
      draw();
    }
  }

  function softDrop() {
    if (!currentPiece || isGameOver || isPaused) return;
    if (!collides(currentPiece, 0, 1)) {
      currentPiece.y += 1;
      score += 1;
      updateScore();
    } else {
      lockPiece();
    }
    dropCounter = 0;
    draw();
  }

  function hardDrop() {
    if (!currentPiece || isGameOver || isPaused) return;
    while (!collides(currentPiece, 0, 1)) {
      currentPiece.y += 1;
      score += 2;
    }
    updateScore();
    lockPiece();
    draw();
  }

  function lockPiece() {
    mergePiece();
    clearLines();
    spawnPiece();
  }

  function spawnPiece() {
    currentPiece = randomPiece();
    if (collides(currentPiece, 0, 0)) {
      endGame();
    }
  }

  function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.strokeRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(x * BLOCK + 3, y * BLOCK + 3, BLOCK - 6, BLOCK - 6);
  }

  function draw() {
    ctx.fillStyle = '#050816';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK, 0);
      ctx.lineTo(x * BLOCK, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK);
      ctx.lineTo(canvas.width, y * BLOCK);
      ctx.stroke();
    }

    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) drawBlock(x, y, colors[cell]);
      });
    });

    if (currentPiece) {
      currentPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (!value) return;
          const drawX = currentPiece.x + x;
          const drawY = currentPiece.y + y;
          if (drawY >= 0) drawBlock(drawX, drawY, colors[currentPiece.type]);
        });
      });
    }

    if (isPaused && !isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  function gameLoop(time = 0) {
    if (isGameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isPaused) {
      dropCounter += deltaTime;
      if (dropCounter > dropInterval) softDrop();
      draw();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    board = createBoard();
    currentPiece = null;
    score = 0;
    dropCounter = 0;
    dropInterval = 720;
    lastTime = 0;
    isGameOver = false;
    isPaused = false;
    updateScore();
    renderHighScores();
    if (gameOverEl) gameOverEl.classList.add('hidden');
    if (pauseBtn) pauseBtn.textContent = 'Pause';
    spawnPiece();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    isGameOver = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    saveHighScore(score);
    renderHighScores();
    if (finalScoreEl) finalScoreEl.textContent = String(score);
    if (gameOverEl) gameOverEl.classList.remove('hidden');
    playToneSequence('gameover');
    draw();
  }

  function bringTetrisToFront() {
    tetrisZIndex += 1;
    tetrisWindow.style.zIndex = String(tetrisZIndex);
  }

  function createTetrisTaskButton() {
    const tabbar = document.querySelector('.tabbar');
    if (!tabbar) return null;

    let taskBtn = document.getElementById('task-tetris');
    if (!taskBtn) {
      taskBtn = document.createElement('div');
      taskBtn.id = 'task-tetris';
      taskBtn.className = 'tab_container';
      taskBtn.setAttribute('role', 'button');
      taskBtn.setAttribute('tabindex', '0');

      const img = document.createElement('img');
      img.src = 'assets/tetris.png';
      img.className = 'tab_icon';
      img.alt = 'Tetris';

      const txt = document.createElement('div');
      txt.className = 'tab_text';
      txt.textContent = 'Tetris';

      taskBtn.appendChild(img);
      taskBtn.appendChild(txt);

      const restore = () => {
        tetrisWindow.classList.remove('hidden');
        tetrisWindow.setAttribute('aria-hidden', 'false');
        bringTetrisToFront();
        taskBtn.classList.add('tab_container_focused');
        setTimeout(() => taskBtn.classList.remove('tab_container_focused'), 120);
      };

      taskBtn.addEventListener('click', restore);
      taskBtn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          restore();
        }
      });

      tabbar.appendChild(taskBtn);
    }

    taskBtn.classList.remove('hidden');
    return taskBtn;
  }

  function openTetrisWindow() {
    if (!tetrisWindow.dataset.openedOnce) {
      tetrisWindow.style.top = '';
      tetrisWindow.style.left = '';
      tetrisWindow.style.width = '';
      tetrisWindow.style.height = '';
      tetrisWindow.style.transform = '';
      tetrisWindow.dataset.openedOnce = 'true';
    }

    tetrisWindow.classList.remove('hidden');
    tetrisWindow.setAttribute('aria-hidden', 'false');
    bringTetrisToFront();
    createTetrisTaskButton();
    playToneSequence('open');
    startGame();
  }

  function closeTetrisWindow() {
    tetrisWindow.classList.add('hidden');
    tetrisWindow.setAttribute('aria-hidden', 'true');
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    const taskBtn = document.getElementById('task-tetris');
    if (taskBtn) taskBtn.remove();
  }

  window.openTetrisWindow = openTetrisWindow;

  tetrisIcon.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openTetrisWindow();
  });

  tetrisWindow.addEventListener('mousedown', bringTetrisToFront);
  tetrisWindow.addEventListener('touchstart', bringTetrisToFront, { passive: true });

  const closeBtn = tetrisWindow.querySelector('.win-btn.close');
  const minimiseBtn = tetrisWindow.querySelector('.win-btn.minimise');
  const maximiseBtn = tetrisWindow.querySelector('.win-btn.maximise');

  if (closeBtn) closeBtn.addEventListener('click', closeTetrisWindow);

  if (minimiseBtn) {
    minimiseBtn.addEventListener('click', () => {
      tetrisWindow.classList.add('hidden');
      tetrisWindow.setAttribute('aria-hidden', 'true');
      createTetrisTaskButton();
    });
  }

  if (maximiseBtn) {
    maximiseBtn.addEventListener('click', () => {
      if (!tetrisWindow.classList.contains('fullscreen')) {
        const prev = {
          left: tetrisWindow.style.left || '',
          top: tetrisWindow.style.top || '',
          width: tetrisWindow.style.width || '',
          height: tetrisWindow.style.height || ''
        };
        try { tetrisWindow.dataset.prevStyle = JSON.stringify(prev); } catch (err) {}
        tetrisWindow.classList.add('fullscreen');
        tetrisWindow.style.left = '';
        tetrisWindow.style.top = '';
        tetrisWindow.style.width = '';
        tetrisWindow.style.height = '';
        const img = maximiseBtn.querySelector('img.btn-icon');
        if (img) img.src = 'assets/resize.png';
      } else {
        tetrisWindow.classList.remove('fullscreen');
        try {
          const prev = tetrisWindow.dataset.prevStyle ? JSON.parse(tetrisWindow.dataset.prevStyle) : null;
          if (prev) {
            tetrisWindow.style.left = prev.left;
            tetrisWindow.style.top = prev.top;
            tetrisWindow.style.width = prev.width;
            tetrisWindow.style.height = prev.height;
          }
        } catch (err) {
          tetrisWindow.style.left = '';
          tetrisWindow.style.top = '';
          tetrisWindow.style.width = '';
          tetrisWindow.style.height = '';
        }
        const img = maximiseBtn.querySelector('img.btn-icon');
        if (img) img.src = 'assets/maximise.png';
      }
      bringTetrisToFront();
      draw();
    });
  }

  function setupButtonIconHover(btn, normal, hover) {
    if (!btn) return;
    const img = btn.querySelector('img.btn-icon');
    if (!img) return;
    img.src = normal;
    btn.addEventListener('mouseenter', () => { img.src = hover; });
    btn.addEventListener('mouseleave', () => {
      if (btn === maximiseBtn && tetrisWindow.classList.contains('fullscreen')) {
        img.src = 'assets/resize.png';
      } else {
        img.src = normal;
      }
    });
  }

  setupButtonIconHover(minimiseBtn, 'assets/minimise.png', 'assets/minimise_hover.png');
  setupButtonIconHover(maximiseBtn, 'assets/maximise.png', 'assets/maximise_hover.png');
  setupButtonIconHover(closeBtn, 'assets/close.png', 'assets/close_hover.png');

  function makeTetrisDraggable() {
    const handle = tetrisWindow.querySelector('.titlebar');
    if (!handle) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function beginDrag(clientX, clientY) {
      if (tetrisWindow.classList.contains('fullscreen')) return;
      dragging = true;
      startX = clientX;
      startY = clientY;
      const rect = tetrisWindow.getBoundingClientRect();
      startLeft = rect.left || 0;
      startTop = rect.top || 0;
      tetrisWindow.style.transform = 'none';
      tetrisWindow.style.left = `${startLeft}px`;
      tetrisWindow.style.top = `${startTop}px`;
      bringTetrisToFront();
      document.body.style.userSelect = 'none';
    }

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.win-btn')) return;
      beginDrag(e.clientX, e.clientY);
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      tetrisWindow.style.left = `${startLeft + e.clientX - startX}px`;
      tetrisWindow.style.top = `${startTop + e.clientY - startY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
    });

    handle.addEventListener('touchstart', (e) => {
      if (e.target.closest('.win-btn')) return;
      const t = e.touches[0];
      beginDrag(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      tetrisWindow.style.left = `${startLeft + t.clientX - startX}px`;
      tetrisWindow.style.top = `${startTop + t.clientY - startY}px`;
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
    });
  }

  makeTetrisDraggable();

  if (leftBtn) leftBtn.addEventListener('click', () => movePiece(-1));
  if (rightBtn) rightBtn.addEventListener('click', () => movePiece(1));
  if (rotateBtn) rotateBtn.addEventListener('click', rotatePiece);
  if (dropBtn) dropBtn.addEventListener('click', hardDrop);
  if (newGameBtn) newGameBtn.addEventListener('click', startGame);
  if (playAgainBtn) playAgainBtn.addEventListener('click', startGame);
  if (quitBtn) quitBtn.addEventListener('click', closeTetrisWindow);

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (isGameOver) return;
      isPaused = !isPaused;
      pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
      draw();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (tetrisWindow.classList.contains('hidden')) return;
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'p', 'P'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft') movePiece(-1);
    else if (e.key === 'ArrowRight') movePiece(1);
    else if (e.key === 'ArrowUp') rotatePiece();
    else if (e.key === 'ArrowDown') softDrop();
    else if (e.key === ' ') hardDrop();
    else if ((e.key === 'p' || e.key === 'P') && pauseBtn) pauseBtn.click();
  });

  renderHighScores();
  draw();
});

/* ============================================================
   FLOATING PORTFOLIO TOOLTIP OVERLAY
   Uses a body-level tooltip so hover dialogue boxes are not clipped by
   the Windows form, right panel, gallery strip, or fullscreen containers.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const tooltipTargets = Array.from(document.querySelectorAll(
    '#view-work .gallery-slider-icon[data-tooltip-date], #view-work .work-doc-item[data-tooltip-date], #view-work .work-video-item[data-tooltip-date]'
  ));

  if (!tooltipTargets.length) return;

  let activeTarget = null;
  let tooltip = document.querySelector('.portfolio-floating-tooltip');

  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'portfolio-floating-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);
  }

  function setTooltipContent(target) {
    const fileName =
      target.dataset.galleryFilename ||
      target.dataset.projectFilename ||
      'File name not provided';
    const date = target.dataset.tooltipDate || 'Placeholder date';
    const description = target.dataset.tooltipDescription || 'Placeholder description.';

    tooltip.textContent =
      `File name: ${fileName}\n` +
      `Date: ${date}\n` +
      description;
  }

  function positionTooltip(target) {
    if (!target || !tooltip) return;

    const gap = 10;
    const viewportPadding = 8;
    const targetRect = target.getBoundingClientRect();

    // Force every portfolio tooltip to open from the RIGHT side of the icon.
    // The older behavior flipped the tooltip to the left when the item was near
    // the right edge of the Windows form. This version never flips. Instead,
    // it narrows the tooltip when needed so items such as Long Form Video 5/10
    // and Short Form Video 5/10 still show the dialogue on the right.
    tooltip.classList.remove('tooltip-left');
    tooltip.classList.add('is-visible');

    const preferredLeft = targetRect.right + gap;
    const availableRight = window.innerWidth - preferredLeft - viewportPadding;
    const tooltipWidth = Math.max(150, Math.min(240, availableRight));

    tooltip.style.width = `${Math.round(tooltipWidth)}px`;

    // Keep the left edge anchored to the right side of the icon. Do not clamp
    // the left value backward, because that makes the tooltip appear on the
    // left side of the icon.
    const left = preferredLeft;

    const tooltipRect = tooltip.getBoundingClientRect();
    let top = targetRect.top + 8;

    if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - tooltipRect.height - viewportPadding;
    }

    if (top < viewportPadding) top = viewportPadding;

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function showTooltip(target) {
    activeTarget = target;
    setTooltipContent(target);
    positionTooltip(target);
  }

  function hideTooltip(target) {
    if (target && activeTarget && target !== activeTarget) return;
    activeTarget = null;
    tooltip.classList.remove('is-visible', 'tooltip-left');
  }

  tooltipTargets.forEach((target) => {
    if (target.dataset.floatingTooltipReady === 'true') return;
    target.dataset.floatingTooltipReady = 'true';

    target.addEventListener('mouseenter', () => showTooltip(target));
    target.addEventListener('mousemove', () => positionTooltip(target));
    target.addEventListener('mouseleave', () => hideTooltip(target));
    target.addEventListener('focus', () => showTooltip(target));
    target.addEventListener('blur', () => hideTooltip(target));
  });

  window.addEventListener('scroll', () => {
    if (activeTarget) positionTooltip(activeTarget);
  }, true);

  window.addEventListener('resize', () => {
    if (activeTarget) positionTooltip(activeTarget);
  });
});

/* ============================================================
   RESPONSIVE DESKTOP WINDOW CONSTRAINTS
   Keeps normal windows inside the visible desktop when the browser size or
   monitor aspect ratio changes. Fullscreen windows continue to use the
   dedicated fullscreen CSS and always leave the XP taskbar visible.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const windows = Array.from(document.querySelectorAll('.winform'));

  function constrainVisibleWindows() {
    windows.forEach(keepWindowInsideViewport);
  }

  window.addEventListener('resize', constrainVisibleWindows, { passive: true });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const target = mutation.target;
      if (target instanceof HTMLElement && target.classList.contains('winform')) {
        keepWindowInsideViewport(target);
      }
    });
  });

  windows.forEach((winEl) => {
    observer.observe(winEl, { attributes: true, attributeFilter: ['class'] });
  });

  constrainVisibleWindows();
});