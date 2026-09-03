(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const layer = qs("#window-layer");
  const taskbarApps = qs("#taskbar-apps");
  const startMenu = qs("#start-menu");
  const projects = JSON.parse(qs("#projects-data")?.textContent || "[]");
  const photos = JSON.parse(qs("#photos-data")?.textContent || "[]");

  let z = 30;
  let windowCount = 0;
  const openWindows = new Map();

  const bootMessages = [
    "Starting TanishaOS…",
    "Loading desktop…",
    "Almost there…"
  ];

  function showLogin(){
    qs("#boot-screen")?.classList.add("done");
    const login = qs("#login-screen");
    if(login){
      login.hidden = false;
      setTimeout(() => qs("#login-password")?.focus(), 150);
    }
  }

  function unlockDesktop(){
    const login = qs("#login-screen");
    if(!login) return;
    login.classList.add("unlocked");
    sessionStorage.setItem("tanishaOSUnlocked","true");
    setTimeout(() => {
      login.hidden = true;
    }, 420);
  }

  function boot(){
    if(sessionStorage.getItem("tanishaOSUnlocked") === "true"){
      qs("#boot-screen")?.classList.add("done");
      qs("#login-screen").hidden = true;
      return;
    }

    let i = 0;
    const line = qs("#boot-line");
    const tick = () => {
      if(i < bootMessages.length){
        line.textContent = bootMessages[i++];
        setTimeout(tick, 420);
      }else{
        setTimeout(showLogin, 260);
      }
    };
    setTimeout(tick, 250);
  }

  qs("#skip-boot")?.addEventListener("click", showLogin);

  qs("#login-form")?.addEventListener("submit", e => {
    e.preventDefault();
    const field = qs("#login-password");
    const value = field.value.trim().toLowerCase();
    const accepted = ["fight on", "fighton"];

    if(accepted.includes(value)){
      qs("#login-error").textContent = "";
      unlockDesktop();
    }else{
      qs("#login-error").textContent = "Incorrect password";
      qs(".login-card")?.classList.remove("login-shake");
      void qs(".login-card")?.offsetWidth;
      qs(".login-card")?.classList.add("login-shake");
      field.select();
    }
  });

  boot();

  function clockTick(){
    const now = new Date();
    qs("#clock").textContent = now.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
    qs("#clock").title = now.toLocaleDateString([], {weekday:"long", year:"numeric", month:"long", day:"numeric"});
  }
  clockTick();
  setInterval(clockTick, 1000);

  function toast(title, message){
    const node = document.createElement("div");
    node.className = "toast";
    node.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
    qs("#toast-area").appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  function activate(win){
    qsa(".os-window").forEach(w => w.classList.remove("active"));
    qsa(".taskbar-app").forEach(b => b.classList.remove("active"));
    win.classList.add("active");
    win.style.zIndex = ++z;
    qs(`[data-task-id="${win.dataset.windowId}"]`)?.classList.add("active");
  }

  function makeDraggable(win, handle){
    let dragging = false, startX=0, startY=0, startL=0, startT=0;
    handle.addEventListener("mousedown", e => {
      if(e.target.closest(".window-controls") || win.classList.contains("maximized")) return;
      dragging = true;
      activate(win);
      const rect = win.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startL = rect.left; startT = rect.top;
      e.preventDefault();
    });
    window.addEventListener("mousemove", e => {
      if(!dragging) return;
      win.style.left = Math.max(0, startL + e.clientX - startX) + "px";
      win.style.top = Math.max(0, startT + e.clientY - startY) + "px";
    });
    window.addEventListener("mouseup", () => dragging = false);
  }

  function createWindow(id, title, body, icon="□"){
    if(openWindows.has(id)){
      const existing = openWindows.get(id);
      existing.hidden = false;
      activate(existing);
      return existing;
    }

    const win = document.createElement("section");
    win.className = "os-window";
    win.dataset.windowId = id;
    win.style.left = `${90 + (windowCount * 28) % 220}px`;
    win.style.top = `${65 + (windowCount * 24) % 150}px`;
    windowCount++;

    win.innerHTML = `
      <header class="os-titlebar">
        <div class="os-title"><span>${icon}</span><span>${title}</span></div>
        <div class="window-controls">
          <button class="minimize">—</button>
          <button class="maximize">□</button>
          <button class="close">×</button>
        </div>
      </header>
      <div class="os-content">${body}</div>
    `;

    layer.appendChild(win);
    openWindows.set(id, win);

    const task = document.createElement("button");
    task.className = "taskbar-app";
    task.dataset.taskId = id;
    task.textContent = `${icon} ${title}`;
    task.onclick = () => {
      win.hidden = !win.hidden && win.classList.contains("active");
      if(!win.hidden) activate(win);
    };
    taskbarApps.appendChild(task);

    qs(".close", win).onclick = () => {
      win.remove();
      task.remove();
      openWindows.delete(id);
    };
    qs(".minimize", win).onclick = () => {
      win.hidden = true;
      task.classList.remove("active");
    };
    qs(".maximize", win).onclick = () => {
      win.classList.toggle("maximized");
      activate(win);
    };

    win.addEventListener("mousedown", () => activate(win));
    makeDraggable(win, qs(".os-titlebar", win));
    activate(win);
    return win;
  }

  function aboutFolder(){
    return `
      <div class="app-toolbar">
        <div class="pathbar">C:\\Users\\Tanisha\\About Me</div>
      </div>
      <div class="explorer-main">
        <div class="file-grid about-file-grid">
          <button class="file-item" data-about-file="about">
            <div class="file-icon">TXT</div><span>About.txt</span>
          </button>
          <button class="file-item" data-open="resume">
            <div class="file-icon pdf-file-icon">PDF</div><span>Resume.pdf</span>
          </button>
          <button class="file-item" data-about-file="contact">
            <div class="file-icon">TXT</div><span>Contact.txt</span>
          </button>
        </div>
      </div>`;
  }

  const aboutFiles = {
    about: {
      eyebrow: "ABOUT.TXT",
      title: "I’m Tanisha!",
      lede: "I’m a sophomore at USC studying Physics and Computer Science with a minor in Computational Neuroscience.",
      paragraphs: [
        `I grew up in Singapore, and I’ve always been someone who gets a lot of energy from the people around me. I love meeting new people, making friends, and being there for the people I care about. Before transferring to USC, I spent time at UC Santa Cruz and was involved in Greek life, where our philanthropy partner was Girls on the Run Santa Cruz. Supporting their work and participating in the Girls on the Run 5K was especially meaningful to me because I loved seeing so many girls encourage each other and feel genuinely proud of what they accomplished.`,
        `I also volunteer with ENGin, which pairs English-speaking volunteers with Ukrainians for recurring conversation practice and cultural exchange. I initially loved the idea because language can change how comfortably someone is able to participate in school, work, and everyday conversations, but I’ve stayed involved because I really value the consistency of showing up for another person. It feels much more personal than teaching from a worksheet — the goal is to help someone become more confident expressing themselves while also getting to know a person whose life looks very different from mine.`,
        `Outside of school, I did ballet for 10 years, love the arts, and am currently learning Carnatic music with my sister. I’m also very spontaneous and usually down for a random plan, especially if it means trying something new, going somewhere I haven’t been, or meeting people I probably would not have met otherwise.`,
        `At USC, I’m especially interested in what happens when hardware, software, and biology stop being separate subjects. Computational Neuroscience gives me a way to think about technology alongside something as complex and personal as the human brain, and that is a big part of what draws me toward medtech. I’m most excited by problems where the existing answer is incomplete — especially when solving one person's very specific problem can reveal a solution that could eventually help a much larger group of people.`,
        `I’m also stubborn in a way that has become useful when I build things. If an idea fails, I usually want to understand exactly why before I move on. But I’m not attached to being right about the first approach: I’ve learned to throw away mechanisms I spent hours building, rewrite things that technically worked but were not good enough, and change direction when the evidence is pointing somewhere else. I like ambitious problems because they give me more chances to do that. For me, determination is less about forcing one idea to succeed and more about staying with the problem long enough to find the version that does.`
      ]
    },

    contact: {
      eyebrow: "CONTACT.TXT",
      title: "Find me",
      lede: "The easiest ways to reach me or see what I’m working on.",
      links: [
        ["Email", "tanishas@usc.edu", "mailto:tanishas@usc.edu"],
        ["LinkedIn", "linkedin.com/in/tanishasrinivasan/", "https://linkedin.com/in/tanishasrinivasan/"],
        ["Phone", "(650) 660-5322", "tel:+16506605322"]
      ]
    }
  };

  function aboutDocument(key){
    const doc = aboutFiles[key];
    const paragraphs = (doc.paragraphs || [])
      .map(text => `<p>${escapeHtml(text)}</p>`)
      .join("");

    const links = (doc.links || [])
      .map(([label, value, href]) => `
        <a class="contact-row" href="${href}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
          <span class="contact-label">${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <span class="contact-arrow">↗</span>
        </a>
      `).join("");

    return `
      <article class="profile-doc profile-doc-${key}">
        <header class="profile-doc-header">
          <div>
            <span class="profile-eyebrow">${escapeHtml(doc.eyebrow)}</span>
            <h1>${escapeHtml(doc.title)}</h1>
            <p class="profile-lede">${escapeHtml(doc.lede)}</p>
          </div>
          <div class="profile-visual-stack">
            <img
              class="profile-headshot"
              src="${window.TANISHA_HEADSHOT_URL || 'assets/photos/tanisha-headshot.jpg'}"
              alt="Tanisha Srinivasan"
            >
            <div class="profile-orbit" aria-hidden="true">
              <span>TS</span>
            </div>
          </div>
        </header>

        ${paragraphs ? `<section class="profile-prose">${paragraphs}</section>` : ""}
        ${links ? `<section class="contact-list">${links}</section>` : ""}
      </article>`;
  }

  function projectsFolder(){
    const finished = projects.filter(project => !project.current);
    return `
      <div class="app-toolbar">
        <div class="pathbar">C:\\Users\\Tanisha\\Projects</div>
      </div>
      <div class="explorer-main">
        <div class="file-grid project-folder-grid">
          ${finished.map(p => `
            <button class="file-item" data-project="${p.id}">
              <div class="file-icon project-folder-icon">DIR</div>
              <span>${p.title}</span>
              <small class="file-subtitle">${p.status}</small>
            </button>
          `).join("")}

          <button class="file-item" data-currently-building>
            <div class="file-icon current-folder-icon">DIR</div>
            <span>Currently Building</span>
            <small class="file-subtitle">ACTIVE</small>
          </button>
        </div>
      </div>`;
  }

  function currentlyBuildingFolder(){
    const current = projects.filter(project => project.current);
    return `
      <div class="app-toolbar">
        <div class="pathbar">C:\\Users\\Tanisha\\Projects\\Currently Building</div>
      </div>
      <div class="explorer-main">
        <div class="current-folder-intro">
          <span>WORK IN PROGRESS</span>
          <p>Projects that are still changing while this site is live.</p>
        </div>
        <div class="file-grid project-folder-grid">
          ${current.map(p => `
            <button class="file-item" data-project="${p.id}">
              <div class="file-icon current-project-icon">DEV</div>
              <span>${p.title}</span>
              <small class="file-subtitle">${p.status}</small>
            </button>
          `).join("")}
        </div>
      </div>`;
  }

  function escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;");
  }

  function projectArticle(project){
    const tags = (project.tags || [])
      .map(tag => `<span class="project-tag">${escapeHtml(tag)}</span>`)
      .join("");

    const sections = (project.sections || []).map((section, index) => `
      <section class="project-story-section">
        <div class="project-story-copy">
          <span class="section-kicker">${String(index + 1).padStart(2,"0")}</span>
          <h2>${escapeHtml(section.heading)}</h2>
          <p>${escapeHtml(section.body).replaceAll("\\n","<br>")}</p>
        </div>
        <figure class="project-photo-slot">
          <div class="project-photo-placeholder">
            <span>INSERT PHOTO</span>
          </div>
        </figure>
      </section>
    `).join("");

    return `
      <article class="project-reader">
        <header class="project-hero">
          <div class="project-hero-meta">
            <span class="project-status">${escapeHtml(project.status)}</span>
            <span>README.md</span>
          </div>
          <h1>${escapeHtml(project.title)}</h1>
          <p>${escapeHtml(project.subtitle || "")}</p>
          <div class="project-tags">${tags}</div>
        </header>
        <section class="project-intro">
          <p>${escapeHtml(project.intro || "").replaceAll("\\n","<br>")}</p>
        </section>
        ${sections}
        <footer class="project-end"><span>END OF README.md</span></footer>
      </article>`;
  }

  function resumeApp(){
    const url = window.TANISHA_RESUME_URL || "assets/resume/Tanisha_Srinivasan_Resume.pdf";
    return `
      <div class="pdf-toolbar">
        <a class="pdf-action" href="${url}" target="_blank" rel="noopener">Open in new tab</a>
        <a class="pdf-action" href="${url}" download>Download</a>
      </div>
      <iframe class="resume-frame" src="${url}#view=FitH" title="Tanisha Srinivasan Resume"></iframe>`;
  }

  function photosApp(){
    return `
      <div class="app-toolbar">
        <div class="pathbar">C:\Users\Tanisha\Photos\All Photos</div>
      </div>
      <div class="photos-app">
        <div class="photos-header">
          <h2>Photos</h2>
          <p>little moments / friends / family / random snapshots</p>
        </div>

        <div class="photos-grid">
          ${photos.map(photo => `
            <button class="photo-card" data-photo-id="${photo.id}">
              <div class="photo-thumb">
                <img src="${(window.TANISHA_BASE_URL || '') + (window.TANISHA_BASE_URL || '') + '/assets/photos/' + photo.file}" alt="${escapeHtml(photo.title)}">
              </div>
              <div class="photo-meta">
                <strong>${escapeHtml(photo.title)}</strong>
                <span>${escapeHtml(photo.caption || "")}</span>
              </div>
            </button>
          `).join("")}
        </div>
      </div>`;
  }

  function photoViewer(photo){
    return `
      <div class="photo-viewer">
        <div class="photo-viewer-image-wrap">
          <img class="photo-viewer-image" src="${(window.TANISHA_BASE_URL || '') + (window.TANISHA_BASE_URL || '') + '/assets/photos/' + photo.file}" alt="Photo">
        </div>
      </div>`;
  }

  function tetrisApp(){
    return `
      <div class="tetris-app" tabindex="0" aria-label="Tetris game. Use arrow keys to move, up to rotate, space to hard drop, P to pause.">
        <div class="tetris-stage">
          <canvas class="tetris-board" width="300" height="600" aria-label="Tetris board"></canvas>
        </div>
        <aside class="tetris-sidebar">
          <div class="tetris-brand">TETRIS.EXE</div>

          <div class="tetris-stat"><span>SCORE</span><strong data-tetris-score>0</strong></div>
          <div class="tetris-stat"><span>LINES</span><strong data-tetris-lines>0</strong></div>
          <div class="tetris-stat"><span>LEVEL</span><strong data-tetris-level>1</strong></div>

          <div class="tetris-next-panel">
            <span>NEXT</span>
            <canvas class="tetris-next" width="120" height="120"></canvas>
          </div>

          <div class="tetris-controls-copy">
            <div><kbd>←</kbd><kbd>→</kbd> move</div>
            <div><kbd>↓</kbd> soft drop</div>
            <div><kbd>↑</kbd> rotate</div>
            <div><kbd>SPACE</kbd> hard drop</div>
            <div><kbd>P</kbd> pause</div>
          </div>

          <div class="tetris-actions">
            <button type="button" data-tetris-pause>Pause</button>
            <button type="button" data-tetris-restart>Restart</button>
          </div>

          <div class="tetris-mobile-controls" aria-label="Tetris controls">
            <button type="button" data-tetris-action="left">←</button>
            <button type="button" data-tetris-action="rotate">↻</button>
            <button type="button" data-tetris-action="right">→</button>
            <button type="button" data-tetris-action="down">↓</button>
            <button type="button" data-tetris-action="drop">DROP</button>
          </div>

          <div class="tetris-message" data-tetris-message>Click the game or press a key to start.</div>
        </aside>
      </div>`;
  }

  function initTetris(win){
    const root = qs('.tetris-app', win);
    const canvas = qs('.tetris-board', win);
    const nextCanvas = qs('.tetris-next', win);
    if(!root || !canvas || root.dataset.initialized) return;
    root.dataset.initialized = 'true';

    const ctx = canvas.getContext('2d');
    const nextCtx = nextCanvas.getContext('2d');
    const COLS = 10, ROWS = 20, BLOCK = 30;
    const palette = {
      I:'#7dd7f3', O:'#f4d35e', T:'#b68cff', S:'#78d381',
      Z:'#ef7d7d', J:'#7598ed', L:'#f2a65a'
    };
    const shapes = {
      I:[[1,1,1,1]],
      O:[[1,1],[1,1]],
      T:[[0,1,0],[1,1,1]],
      S:[[0,1,1],[1,1,0]],
      Z:[[1,1,0],[0,1,1]],
      J:[[1,0,0],[1,1,1]],
      L:[[0,0,1],[1,1,1]]
    };

    let board, current, next, score, lines, level, paused, gameOver, started;
    let dropCounter = 0, lastTime = 0;

    const scoreNode = qs('[data-tetris-score]', win);
    const linesNode = qs('[data-tetris-lines]', win);
    const levelNode = qs('[data-tetris-level]', win);
    const messageNode = qs('[data-tetris-message]', win);
    const pauseButton = qs('[data-tetris-pause]', win);

    function emptyBoard(){ return Array.from({length:ROWS},()=>Array(COLS).fill('')); }
    function cloneShape(shape){ return shape.map(row=>row.slice()); }
    function randomType(){ return Object.keys(shapes)[Math.floor(Math.random()*7)]; }
    function makePiece(type=randomType()){
      return { type, matrix:cloneShape(shapes[type]), x:0, y:0 };
    }
    function spawn(){
      current = next || makePiece();
      next = makePiece();
      current.y = 0;
      current.x = Math.floor((COLS-current.matrix[0].length)/2);
      if(collides(current,0,0,current.matrix)){
        gameOver = true;
        messageNode.textContent = 'Game over — press Restart.';
      }
      drawNext();
    }
    function collides(piece, dx=0, dy=0, matrix=piece.matrix){
      for(let y=0;y<matrix.length;y++){
        for(let x=0;x<matrix[y].length;x++){
          if(!matrix[y][x]) continue;
          const bx = piece.x + x + dx;
          const by = piece.y + y + dy;
          if(bx < 0 || bx >= COLS || by >= ROWS) return true;
          if(by >= 0 && board[by][bx]) return true;
        }
      }
      return false;
    }
    function merge(){
      current.matrix.forEach((row,y)=>row.forEach((v,x)=>{
        if(v && current.y+y>=0) board[current.y+y][current.x+x]=current.type;
      }));
    }
    function rotate(matrix){
      return matrix[0].map((_,i)=>matrix.map(row=>row[i]).reverse());
    }
    function rotateCurrent(){
      if(paused || gameOver) return;
      const rotated = rotate(current.matrix);
      for(const kick of [0,-1,1,-2,2]){
        if(!collides(current,kick,0,rotated)){
          current.x += kick;
          current.matrix = rotated;
          return;
        }
      }
    }
    function clearLines(){
      let cleared=0;
      outer: for(let y=ROWS-1;y>=0;y--){
        for(let x=0;x<COLS;x++) if(!board[y][x]) continue outer;
        board.splice(y,1);
        board.unshift(Array(COLS).fill(''));
        cleared++; y++;
      }
      if(cleared){
        const points=[0,100,300,500,800][cleared] * level;
        score += points;
        lines += cleared;
        level = Math.floor(lines/10)+1;
        updateStats();
      }
    }
    function lockPiece(){
      merge();
      clearLines();
      spawn();
    }
    function move(dx){
      if(paused || gameOver) return;
      if(!collides(current,dx,0)) current.x += dx;
    }
    function softDrop(){
      if(paused || gameOver) return;
      if(!collides(current,0,1)){
        current.y++;
        score += 1;
        updateStats();
      } else {
        lockPiece();
      }
      dropCounter = 0;
    }
    function autoDrop(){
      if(!collides(current,0,1)) current.y++;
      else lockPiece();
      dropCounter = 0;
    }
    function hardDrop(){
      if(paused || gameOver) return;
      let distance=0;
      while(!collides(current,0,1)){
        current.y++;
        distance++;
      }
      score += distance*2;
      updateStats();
      lockPiece();
    }
    function togglePause(){
      if(gameOver) return;
      paused = !paused;
      pauseButton.textContent = paused ? 'Resume' : 'Pause';
      messageNode.textContent = paused ? 'Paused' : '';
    }
    function updateStats(){
      scoreNode.textContent = score.toLocaleString();
      linesNode.textContent = lines;
      levelNode.textContent = level;
    }
    function drawCell(context,x,y,color,size=BLOCK,offsetX=0,offsetY=0){
      context.fillStyle=color;
      context.fillRect(offsetX+x*size+1,offsetY+y*size+1,size-2,size-2);
      context.fillStyle='rgba(255,255,255,.20)';
      context.fillRect(offsetX+x*size+3,offsetY+y*size+3,size-6,3);
      context.strokeStyle='rgba(0,0,0,.25)';
      context.strokeRect(offsetX+x*size+1.5,offsetY+y*size+1.5,size-3,size-3);
    }
    function drawBoardGrid(){
      ctx.fillStyle='#0c1020';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle='rgba(255,255,255,.045)';
      ctx.lineWidth=1;
      for(let x=0;x<=COLS;x++){
        ctx.beginPath();ctx.moveTo(x*BLOCK+.5,0);ctx.lineTo(x*BLOCK+.5,ROWS*BLOCK);ctx.stroke();
      }
      for(let y=0;y<=ROWS;y++){
        ctx.beginPath();ctx.moveTo(0,y*BLOCK+.5);ctx.lineTo(COLS*BLOCK,y*BLOCK+.5);ctx.stroke();
      }
    }
    function draw(){
      drawBoardGrid();
      board.forEach((row,y)=>row.forEach((type,x)=>{
        if(type) drawCell(ctx,x,y,palette[type]);
      }));
      if(current && !gameOver){
        current.matrix.forEach((row,y)=>row.forEach((v,x)=>{
          if(v && current.y+y>=0) drawCell(ctx,current.x+x,current.y+y,palette[current.type]);
        }));
      }
      if(paused){
        ctx.fillStyle='rgba(5,7,14,.72)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#fff';
        ctx.font='700 22px Tahoma';
        ctx.textAlign='center';
        ctx.fillText('PAUSED',canvas.width/2,canvas.height/2);
      }
      if(gameOver){
        ctx.fillStyle='rgba(5,7,14,.78)';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='#fff';
        ctx.font='700 22px Tahoma';
        ctx.textAlign='center';
        ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-8);
        ctx.font='12px Tahoma';
        ctx.fillStyle='rgba(255,255,255,.7)';
        ctx.fillText('Press Restart',canvas.width/2,canvas.height/2+18);
      }
    }
    function drawNext(){
      nextCtx.fillStyle='#101427';
      nextCtx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
      const size=22, matrix=next.matrix;
      const width=matrix[0].length*size, height=matrix.length*size;
      const ox=(nextCanvas.width-width)/2, oy=(nextCanvas.height-height)/2;
      matrix.forEach((row,y)=>row.forEach((v,x)=>{
        if(v) drawCell(nextCtx,x,y,palette[next.type],size,ox,oy);
      }));
    }
    function reset(){
      board=emptyBoard();
      score=0;
      lines=0;
      level=1;
      paused=false;
      gameOver=false;
      started=false;
      next=makePiece();
      spawn();
      updateStats();
      pauseButton.textContent='Pause';
      messageNode.textContent='Click the game or press a key to start.';
      lastTime=performance.now();
      dropCounter=0;
      root.focus();
    }
    function start(){
      if(!started){
        started=true;
        messageNode.textContent='';
      }
    }
    function intervalMs(){
      return Math.max(95, 760-(level-1)*60);
    }
    function loop(time){
      if(!document.body.contains(win)) return;
      const delta=time-lastTime;
      lastTime=time;
      if(started && !paused && !gameOver){
        dropCounter += delta;
        if(dropCounter > intervalMs()) autoDrop();
      }
      draw();
      requestAnimationFrame(loop);
    }
    function action(name){
      start();
      if(name==='left') move(-1);
      if(name==='right') move(1);
      if(name==='down') softDrop();
      if(name==='rotate') rotateCurrent();
      if(name==='drop') hardDrop();
      draw();
      root.focus();
    }

    root.addEventListener('keydown',e=>{
      const key=e.key;
      if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','p','P'].includes(key)) e.preventDefault();
      start();
      if(key==='ArrowLeft') move(-1);
      else if(key==='ArrowRight') move(1);
      else if(key==='ArrowDown') softDrop();
      else if(key==='ArrowUp') rotateCurrent();
      else if(key===' ') hardDrop();
      else if(key==='p'||key==='P') togglePause();
      draw();
    });
    root.addEventListener('pointerdown',()=>root.focus());
    qsa('[data-tetris-action]',win).forEach(btn=>{
      btn.addEventListener('click',()=>action(btn.dataset.tetrisAction));
    });
    qs('[data-tetris-restart]',win).addEventListener('click',reset);
    pauseButton.addEventListener('click',()=>{
      start();
      togglePause();
      root.focus();
    });

    reset();
    requestAnimationFrame(loop);
  }

  function recycleApp(){
    return `
      <div class="app-toolbar"><div class="pathbar">Recycle Bin</div></div>
      <div class="explorer-main">
        <div class="file-grid">
          ${["failed_prototype_1","failed_prototype_2","career_plan_2024.txt"].map(n => `
            <button class="file-item"><div class="file-icon">DEL</div><span>${n}</span></button>
          `).join("")}
          <button class="file-item" data-sleep>
            <div class="file-icon">EXE</div><span>sleep_schedule.exe</span>
          </button>
        </div>
      </div>`;
  }

  function terminalApp(){
    return `
      <div class="terminal">
        <div class="terminal-history">TanishaOS Terminal v1.9.9
Type "help" for commands.

</div>
        <div class="terminal-row">
          <span class="terminal-prompt">C:\\Users\\guest&gt;</span>
          <input autocomplete="off" spellcheck="false">
        </div>
      </div>`;
  }

  function terminalResponse(command){
    switch(command){
      case "help": return `Available commands:
about
projects
resume
photos
skills
contact
github
linkedin
whoami
neofetch
tetris
clear`;
      case "whoami":
        return "You are currently snooping through Tanisha's computer.";
      case "neofetch":
        return `TS  tanisha@usc
------------------------
OS: TanishaOS 1.9.9
School: USC
Home: Singapore
Current Map: Los Angeles
Focus: Hardware + Computing
Projects: Too many
Sleep: unavailable`;
      case "skills":
        return "Hardware prototyping • Arduino • sensors • servos • Python • C/C++ • experimentation";
      case "contact":
        return "Opening Contact.txt…";
      case "about":
        openApp("about"); return "Opening About Me…";
      case "projects":
        openApp("projects"); return "Opening Projects…";
      case "resume":
        openApp("resume"); return "Opening Resume.pdf…";
      case "photos":
        openApp("photos"); return "Opening Photos…";
      case "tetris":
        openApp("tetris"); return "Launching Tetris.exe…";
      case "github":
        return "Add your GitHub URL here.";
      case "linkedin":
        return "Add your LinkedIn URL here.";
      case "":
        return "";
      default:
        return `'${command}' is not recognized as a TanishaOS command. Type help.`;
    }
  }

  function openApp(app){
    startMenu.hidden = true;

    if(app === "about")
      return createWindow("about","About Me",aboutFolder(),"DIR");

    if(app === "projects")
      return createWindow("projects","Projects",projectsFolder(),"DIR");

    if(app === "resume")
      return createWindow("resume","Resume.pdf",resumeApp(),"PDF");

    if(app === "photos"){
      const win = createWindow("photos","Photos",photosApp(),"IMG");
      win.classList.add("photos-window");
      return win;
    }

    if(app === "tetris"){
      const win = createWindow("tetris","Tetris.exe",tetrisApp(),"GAME");
      win.classList.add("tetris-window");
      initTetris(win);
      return win;
    }

    if(app === "recycle")
      return createWindow("recycle","Recycle Bin",recycleApp(),"DEL");

    if(app === "terminal"){
      const win = createWindow("terminal","TanishaOS Terminal",terminalApp(),">_");
      const input = qs("input", win);
      const history = qs(".terminal-history", win);

      if(!input.dataset.bound){
        input.dataset.bound = "true";
        input.addEventListener("keydown", e => {
          if(e.key !== "Enter") return;
          const command = input.value.trim().toLowerCase();

          if(command === "clear"){
            history.textContent = "";
            input.value = "";
            return;
          }

          if(command === "contact"){
            const contactWin = createWindow("about-contact","Contact.txt",aboutDocument("contact"),"TXT");
            contactWin.classList.add("profile-window");
          }

          const response = terminalResponse(command);
          history.textContent += `C:\\Users\\guest> ${command}\n${response}\n\n`;
          input.value = "";
          qs(".terminal", win).scrollTop = qs(".terminal", win).scrollHeight;
        });
      }

      setTimeout(() => input.focus(), 40);
      return win;
    }
  }

  document.addEventListener("click", e => {
    const opener = e.target.closest("[data-open]");
    if(opener){
      openApp(opener.dataset.open);
      return;
    }

    const aboutFile = e.target.closest("[data-about-file]");
    if(aboutFile){
      const key = aboutFile.dataset.aboutFile;
      const title = key === "about" ? "About.txt" : "Contact.txt";
      const win = createWindow(`about-${key}`, title, aboutDocument(key), "TXT");
      win.classList.add("profile-window");
      return;
    }

    const projectButton = e.target.closest("[data-project]");
    if(projectButton){
      const project = projects.find(p => p.id === projectButton.dataset.project);
      if(project){
        const win = createWindow(
          `project-${project.id}`,
          `${project.title} — README.md`,
          projectArticle(project),
          "MD"
        );
        win.classList.add("project-window");
      }
      return;
    }


    const photoCard = e.target.closest("[data-photo-id]");
    if(photoCard){
      const photo = photos.find(p => p.id === photoCard.dataset.photoId);
      if(photo){
        const win = createWindow(
          `photo-${photo.id}`,
          photo.title,
          photoViewer(photo),
          "IMG"
        );
        win.classList.add("photo-viewer-window");
      }
      return;
    }

    if(e.target.closest("[data-currently-building]")){
      const win = createWindow(
        "currently-building",
        "Currently Building",
        currentlyBuildingFolder(),
        "DIR"
      );
      win.classList.add("currently-building-window");
      return;
    }

    if(e.target.closest("[data-sleep]")){
      createWindow("sleep-error","TanishaOS Error",
        `<div class="app-body"><strong>Windows cannot find 'sleep_schedule.exe'.</strong><p>This file may never have existed.</p></div>`,"!");
    }
  });

  qsa(".desktop-icon").forEach(icon => {
    icon.addEventListener("dblclick", () => openApp(icon.dataset.open));
    if(matchMedia("(pointer: coarse)").matches){
      icon.addEventListener("click", () => openApp(icon.dataset.open));
    }
  });

  qs("#start-button").onclick = e => {
    startMenu.hidden = !startMenu.hidden;
    e.stopPropagation();
  };

  document.addEventListener("click", e => {
    if(!startMenu.hidden && !e.target.closest("#start-menu") && !e.target.closest("#start-button")){
      startMenu.hidden = true;
    }
  });

  qs("#shutdown-button").onclick = () => {
    const screen = document.createElement("div");
    screen.className = "shutdown-screen";
    screen.innerHTML = `
      <div>
        <h2>Shutting down TanishaOS…</h2>
        <p>It is now safe to close this tab.</p>
        <p id="still-here" hidden>…why are you still here?</p>
        <button>Restart TanishaOS</button>
      </div>`;
    document.body.appendChild(screen);
    setTimeout(() => qs("#still-here",screen).hidden=false,1800);
    qs("button",screen).onclick = () => screen.remove();
  };

  setTimeout(() => toast("TanishaOS","Double-click a folder to explore."), 2200);
})();
