/* ---------- 初始化数据 ---------- */
let totalBlanks = 0;
const allBlanks = [];

const chips = document.getElementById('chips');
const main  = document.getElementById('main');
const progressTxt = document.getElementById('progress');
const fill = document.getElementById('fill');

DATA.forEach(([title, items], si) => {
  // 章节导航
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.innerHTML = `${title}<span class="c">${items.length}题</span>`;
  chip.onclick = () => {
    document.getElementById('sec-' + si).scrollIntoView({behavior:'smooth', block:'start'});
  };
  chips.appendChild(chip);

  // 章节容器
  const sec = document.createElement('section');
  sec.id = 'sec-' + si;
  const head = document.createElement('div');
  head.className = 'sec-head';
  head.innerHTML = `<h2>${title}</h2><span class="cnt">共 ${items.length} 题</span>`;
  sec.appendChild(head);

  items.forEach(([n, parts], ii) => {
    const item = document.createElement('div');
    item.className = 'item';

    parts.forEach(([text, kind, ans], pi) => {
      const line = document.createElement('div');
      line.className = 'line' + (kind === 'q' ? '' : ' sub');

      if (kind === 'q') {
        const num = document.createElement('div');
        num.className = 'num';
        num.textContent = n;
        num.title = '点击揭晓整题';
        line.appendChild(num);
      }

      const txt = document.createElement('div');
      txt.className = 'txt';

      let bi = 0;
      text.split(/(_+)/).forEach(chunk => {
        if (!chunk) return;
        if (/^_+$/.test(chunk)) {
          const a = (ans && ans[bi] !== undefined) ? ans[bi] : '';
          const b = document.createElement('span');
          b.className = 'blank';
          b.dataset.a = a;
          b.dataset.id = si + '-' + n + '-' + pi + '-' + bi;
          const w = Math.min(Math.max(chunk.length * 0.32, 2.1), 8);
          b.style.setProperty('--w', w + 'em');
          b.textContent = a || '　';
          b.setAttribute('aria-label', '点击揭晓答案');
          txt.appendChild(b);
          totalBlanks++;
          allBlanks.push(b);
          bi++;
        } else {
          txt.appendChild(document.createTextNode(chunk));
        }
      });

      // 把「《 空 》」「“ 空 ”」合并为不可断行单元，避免书名号被拆行
      const kids = [...txt.childNodes];
      for (let i = 0; i + 2 < kids.length; i++) {
        const a = kids[i], b = kids[i + 1], c = kids[i + 2];
        if (a.nodeType !== 3 || c.nodeType !== 3 || !b.classList || !b.classList.contains('blank')) continue;
        if (!/[《“‘]$/.test(a.textContent) || !/^[》”’]/.test(c.textContent)) continue;
        const closeCh = c.textContent[0];
        const nw = document.createElement('span');
        nw.className = 'nw';
        nw.appendChild(a);
        nw.appendChild(b);
        // 闭合符号保留在单元内，其余文字留在外面
        const rest = document.createTextNode(c.textContent.slice(1));
        nw.appendChild(document.createTextNode(closeCh));
        txt.insertBefore(nw, c);
        if (rest.textContent) txt.insertBefore(rest, c);
        txt.removeChild(c);
        // 重新取节点列表，继续扫描
        i = -1;
        kids.length = 0;
        kids.push(...txt.childNodes);
      }

      line.appendChild(txt);

      // 点题号/题干 → 整题；点小项行 → 只切换该行
      line.addEventListener('click', e => {
        if (e.target.closest('.blank')) return;
        if (kind === 'q') toggleItem(item);
        else toggleLine(line);
      });

      item.appendChild(line);
    });

    sec.appendChild(item);
  });

  main.appendChild(sec);
});

document.getElementById('leadBlanks').textContent = totalBlanks;

/* ---------- 揭晓 / 隐藏 ---------- */
function revealBlank(b) {
  if (b.classList.contains('on')) return;
  b.textContent = b.dataset.a || '';
  b.classList.add('on');
  refresh();
}
function hideBlank(b) {
  if (!b.classList.contains('on')) return;
  b.classList.remove('on');
  b.textContent = b.dataset.a || '　';
  refresh();
}
function toggleItem(item) {
  const blanks = item.querySelectorAll('.blank');
  const hasHidden = [...blanks].some(b => !b.classList.contains('on'));
  if (hasHidden) blanks.forEach(revealBlank);
  else blanks.forEach(hideBlank);
}

function toggleLine(line) {
  const blanks = line.querySelectorAll('.blank');
  if (!blanks.length) return;
  const hasHidden = [...blanks].some(b => !b.classList.contains('on'));
  if (hasHidden) blanks.forEach(revealBlank);
  else blanks.forEach(hideBlank);
}

document.getElementById('showAll').onclick = () => {
  allBlanks.forEach(revealBlank);
  document.querySelectorAll('.item').forEach(i => i.classList.add('open'));
};
document.getElementById('hideAll').onclick = () => {
  allBlanks.forEach(hideBlank);
  document.querySelectorAll('.item').forEach(i => i.classList.remove('open'));
};

function refresh() {
  const done = allBlanks.filter(b => b.classList.contains('on')).length;
  progressTxt.textContent = '已揭晓 ' + done + ' / ' + totalBlanks;
  fill.style.width = (totalBlanks ? done / totalBlanks * 100 : 0) + '%';
  // 题号高亮：整题揭晓后变色
  document.querySelectorAll('.item').forEach(i => {
    const bs = i.querySelectorAll('.blank');
    const all = bs.length > 0 && [...bs].every(b => b.classList.contains('on'));
    i.classList.toggle('open', all);
  });
}

/* ---------- 回到顶部 ---------- */
const topBtn = document.getElementById('top');
topBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
window.addEventListener('scroll', () => {
  topBtn.classList.toggle('show', window.scrollY > 600);
}, {passive:true});

/* ---------- 事件委托 ---------- */
main.addEventListener('click', e => {
  const b = e.target.closest('.blank');
  if (!b) return;
  e.stopPropagation();
  if (b.classList.contains('on')) {
    hideBlank(b);
    const item = b.closest('.item');
    if (item) item.classList.remove('open');
  } else {
    revealBlank(b);
  }
});

refresh();
