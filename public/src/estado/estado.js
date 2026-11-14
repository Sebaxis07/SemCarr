// Estado reactivo centralizado de la aplicacion y funciones de acceso
export const appData = {
  alliances: {},
  activities: [],
  creativeChallenges: {},
  tarreoCopa: {},
  announcements: [],
  sorpresas: [],
  sanciones: [],
  reclamos: []
};

export function getAppData() {
  return appData;
}

export function setAppData(newData) {
  Object.keys(appData).forEach(k => delete appData[k]);
  Object.assign(appData, newData);
}

let currentTab = 'inicio';

export function getCurrentTab() {
  return currentTab;
}

export function setCurrentTab(tab) {
  currentTab = tab;
}

let refreshInterval = null;

export function getRefreshInterval() {
  return refreshInterval;
}

export function setRefreshInterval(timer) {
  refreshInterval = timer;
}

let countdownInterval = null;

export function getCountdownInterval() {
  return countdownInterval;
}

export function setCountdownInterval(timer) {
  countdownInterval = timer;
}

export const proyectorState = {
  viewMode: 'leaderboard',
  autoCycle: false,
  autoCycleInterval: null,
  soundEnabled: false,
  lastTotals: { Terror: 0, Shooter: 0, Action: 0 }
};

export function getProyectorState() {
  return proyectorState;
}

let proyectorAudioCtx = null;

export function getProyectorAudioCtx() {
  return proyectorAudioCtx;
}

export function setProyectorAudioCtx(ctx) {
  proyectorAudioCtx = ctx;
}

let currentActFilter = 'all';

export function getCurrentActFilter() {
  return currentActFilter;
}

export function setCurrentActFilter(filter) {
  currentActFilter = filter;
}

let allStudentsByAlliance = null;

export function getAllStudentsByAlliance() {
  return allStudentsByAlliance;
}

export function setAllStudentsByAlliance(data) {
  allStudentsByAlliance = data;
}

let currentAllianceFilter = 'all';

export function getCurrentAllianceFilter() {
  return currentAllianceFilter;
}

export function setCurrentAllianceFilter(filter) {
  currentAllianceFilter = filter;
}

let studentSearchDebounce = null;

export function getStudentSearchDebounce() {
  return studentSearchDebounce;
}

export function setStudentSearchDebounce(timer) {
  studentSearchDebounce = timer;
}
