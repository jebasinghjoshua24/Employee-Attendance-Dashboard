let records = [];
let nextId = 1;
let sortKey = null;
let sortDir = 'asc';

const form = document.getElementById('attendance-form');
const tbody = document.getElementById('report-body');
const output = document.getElementById('output');
const empIdInput = document.getElementById('emp-id');
const recordBadge = document.getElementById('record-badge');
const searchInput = document.getElementById('search-input');


const idModeToggle = document.getElementById('id-mode-toggle');
let isAutoId = true;

const navLinks = document.querySelectorAll('nav a');
const pages = document.querySelectorAll('.page');

const statTotal = document.getElementById('stat-total');
const statAvg = document.getElementById('stat-avg');
const statExcellent = document.getElementById('stat-excellent');
const statGood = document.getElementById('stat-good');
const statAverage = document.getElementById('stat-average');
const statPoor = document.getElementById('stat-poor');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const target = link.getAttribute('href').slice(1);
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(target).classList.add('active');
  });
});

idModeToggle.addEventListener('click', () => {
  isAutoId = !isAutoId;
  if (isAutoId) {
    empIdInput.readOnly = true;
    empIdInput.value = 'EMP' + String(nextId).padStart(3, '0');
    idModeToggle.textContent = 'Auto';
    idModeToggle.classList.remove('manual');
  } else {
    empIdInput.readOnly = false;
    empIdInput.value = '';
    empIdInput.focus();
    idModeToggle.textContent = 'Auto';
    idModeToggle.classList.add('manual');
  }
});

const avatarColors = [
  'oklch(0.55 0.12 230)',
  'oklch(0.55 0.16 30)',
  'oklch(0.55 0.14 140)',
  'oklch(0.65 0.14 75)',
  'oklch(0.5 0.1 280)',
  'oklch(0.6 0.12 190)',
];

function getAvatarColor(index) {
  return avatarColors[index % avatarColors.length];
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getStatus(pct) {
  if (pct >= 90) return { label: 'Excellent', cls: 'badge-excellent' };
  if (pct >= 75) return { label: 'Good', cls: 'badge-good' };
  if (pct >= 50) return { label: 'Average', cls: 'badge-average' };
  return { label: 'Poor', cls: 'badge-poor' };
}

function renderTable() {
  const query = searchInput.value.toLowerCase();
  let filtered = records;
  if (query) {
    filtered = records.filter(r =>
      r.id.toLowerCase().includes(query) || r.name.toLowerCase().includes(query)
    );
  }

  let sorted = [...filtered];
  if (sortKey) {
    sorted.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  tbody.innerHTML = '';

  if (sorted.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-state"><td colspan="5">' +
      '<p>&#128203;</p>' +
      '<p>' + (records.length === 0 ? 'No records yet. Submit attendance data above.' : 'No results match your search.') + '</p>' +
      '</td></tr>';
    return;
  }

  sorted.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.id = r.id;
    tr.innerHTML =
      '<td>' + r.id + '</td>' +
      '<td><div class="name-cell"><span class="avatar" style="background:' + r.avatarColor + '">' + r.initials + '</span><span class="name-text">' + r.name + '</span></div></td>' +
      '<td class="pct-cell">' + r.pct + '%<span class="tooltip">' + r.present + '/' + r.working + ' &times; 100 = ' + r.pct + '%</span></td>' +
      '<td><span class="badge ' + r.statusCls + '">' + r.statusLabel + '</span></td>' +
      '<td><button class="btn-delete" data-id="' + r.id + '" title="Delete">&times;</button></td>';
    tbody.appendChild(tr);

    requestAnimationFrame(() => {
      tr.classList.add('fade-in');
    });
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteRecord(btn.dataset.id);
    });
  });

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = 'asc';
      }
      document.querySelectorAll('th.sortable').forEach(h => h.classList.remove('sorted', 'asc', 'desc'));
      th.classList.add('sorted', sortDir);
      renderTable();
    });
  });
}

function updateStats() {
  const total = records.length;
  statTotal.textContent = total;

  if (total === 0) {
    statAvg.textContent = '—';
    statExcellent.textContent = '0';
    statGood.textContent = '0';
    statAverage.textContent = '0';
    statPoor.textContent = '0';
    return;
  }

  const sum = records.reduce((a, r) => a + r.pctNum, 0);
  const avg = (sum / total).toFixed(1);
  statAvg.textContent = avg + '%';

  let exc = 0, gd = 0, avgc = 0, poor = 0;
  records.forEach(r => {
    if (r.pctNum >= 90) exc++;
    else if (r.pctNum >= 75) gd++;
    else if (r.pctNum >= 50) avgc++;
    else poor++;
  });

  animateStat(statExcellent, exc);
  animateStat(statGood, gd);
  animateStat(statAverage, avgc);
  animateStat(statPoor, poor);

  recordBadge.textContent = total + (total === 1 ? ' record' : ' records');
}

function animateStat(el, newVal) {
  if (el.textContent !== String(newVal)) {
    el.textContent = newVal;
    el.classList.remove('count-up');
    void el.offsetWidth; /* force reflow */
    el.classList.add('count-up');
  }
}


function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveState();
  renderTable();
  updateStats();
}

const STORAGE_KEY = 'attendpro_records';

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      records = JSON.parse(raw);
      const max = records.reduce((m, r) => {
        const num = parseInt(r.id.replace('EMP', ''), 10);
        return num > m ? num : m;
      }, 0);
      nextId = max + 1;
    } catch {
      records = [];
    }
  }
}


form.addEventListener('submit', (e) => {
  e.preventDefault();

  const empName = document.getElementById('emp-name').value.trim();
  const department = document.getElementById('department').value;
  const working = Number(document.getElementById('working-days').value);
  const present = Number(document.getElementById('present-days').value);
  const leave = Number(document.getElementById('leave-days').value);

  if (!empName || !department || !working) {
    output.textContent = 'Please fill in all required fields.';
    return;
  }

  if (present > working) {
    output.textContent = 'Present days cannot exceed working days.';
    return;
  }

  if (leave > working) {
    output.textContent = 'Leave days cannot exceed working days.';
    return;
  }

  if (present + leave !== working) {
    output.textContent = 'Present and Leave days added together cannot exceed working days';
    return;
  }

  output.textContent = '';

  const pctNum = (present / working) * 100;
  const pct = pctNum.toFixed(2);
  const status = getStatus(pctNum);

  let id;
  if (isAutoId) {
    id = 'EMP' + String(nextId).padStart(3, '0');
  } else {
    id = empIdInput.value.trim();
    if (!id) {
      output.textContent = 'Please enter an Employee ID.';
      return;
    }
    if (records.some(r => r.id.toLowerCase() === id.toLowerCase())) {
      output.textContent = 'Employee ID "' + id + '" already exists.';
      return;
    }
  }

  const colorIdx = records.length;

  const record = {
    id: id,
    name: empName,
    dept: department,
    working: working,
    present: present,
    leave: leave,
    pct: pct,
    pctNum: pctNum,
    statusLabel: status.label,
    statusCls: status.cls,
    avatarColor: getAvatarColor(colorIdx),
    initials: getInitials(empName),
  };

  records.push(record);
  nextId++;

  saveState();
  renderTable();
  updateStats();
  form.reset();

  if (isAutoId) {
    empIdInput.value = 'EMP' + String(nextId).padStart(3, '0');
  } else {
    const num = parseInt(id.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) nextId = num + 1;
    isAutoId = true;
    idModeToggle.textContent = 'Auto';
    idModeToggle.classList.remove('manual');
    empIdInput.readOnly = true;
    empIdInput.value = 'EMP' + String(nextId).padStart(3, '0');
  }

  document.getElementById('emp-name').focus();
});

searchInput.addEventListener('input', () => {
  renderTable();
});

loadState();
renderTable();
updateStats();
empIdInput.value = 'EMP' + String(nextId).padStart(3, '0');
