const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../server');

const STUDENTS_FILE = path.join(__dirname, '..', 'students.json');
const DATA_FILE = path.join(__dirname, '..', 'data.json');

test('Inscripcion en cancha: Agregar participante walk in fija alianza y registra asistencia', async () => {
  const studentsBak = fs.readFileSync(STUDENTS_FILE, 'utf8');
  const dataBak = fs.readFileSync(DATA_FILE, 'utf8');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'InacapAdmin2026!' })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    const token = loginData.token;

    const testStudentName = `Alumno Test Cancha ${Date.now()}`;
    const addRes = await fetch(`${baseUrl}/api/admin/participants/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        activityId: 'retro',
        alliance: 'Terror',
        isWalkIn: true,
        newStudent: {
          name: testStudentName,
          rut: '19.876.543-2',
          carrera: 'Ingeniería en Informática'
        },
        loggedBy: 'Staff Test'
      })
    });

    assert.strictEqual(addRes.status, 200);
    const addData = await addRes.json();
    assert.strictEqual(addData.success, true);
    assert.strictEqual(addData.student.alliance, 'Terror');
    assert.strictEqual(addData.student.name, testStudentName);

    const studentsRes = await fetch(`${baseUrl}/api/students/by-alliance`);
    assert.strictEqual(studentsRes.status, 200);
    const studentsData = await studentsRes.json();
    const terrorStudents = studentsData.Terror;
    const found = terrorStudents.find(s => s.name === testStudentName);
    assert.ok(found, 'El alumno walk in debe permanecer en la Alianza Terror');

    const attendRes = await fetch(`${baseUrl}/api/admin/attendance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(attendRes.status, 200);
    const attendData = await attendRes.json();
    const attendee = attendData.allStudents.find(s => s.name === testStudentName);
    assert.ok(attendee, 'El alumno debe figurar en la nomina');
    assert.strictEqual(attendee.attended, true, 'Debe quedar marcado como asistente');
  } finally {
    server.close();
    fs.writeFileSync(STUDENTS_FILE, studentsBak, 'utf8');
    fs.writeFileSync(DATA_FILE, dataBak, 'utf8');
  }
});

test('Asistencia en cancha: Toggle directo de asistencia y registro en puerta', async () => {
  const studentsBak = fs.readFileSync(STUDENTS_FILE, 'utf8');
  const dataBak = fs.readFileSync(DATA_FILE, 'utf8');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'InacapAdmin2026!' })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    const token = loginData.token;

    const doorStudentName = `Alumno Puerta ${Date.now()}`;
    const walkinAttendRes = await fetch(`${baseUrl}/api/admin/attendance/register-walkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: doorStudentName,
        rut: '18.765.432-1',
        carrera: 'Diseño e Industria Digital',
        alliance: 'Action',
        loggedBy: 'Control Cancha'
      })
    });

    assert.strictEqual(walkinAttendRes.status, 200);
    const walkinData = await walkinAttendRes.json();
    assert.strictEqual(walkinData.success, true);
    assert.strictEqual(walkinData.student.alliance, 'Action');

    const studentId = walkinData.student.id;

    const toggleOff = await fetch(`${baseUrl}/api/admin/attendance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId,
        attended: false
      })
    });
    assert.strictEqual(toggleOff.status, 200);
    const toggleOffData = await toggleOff.json();
    assert.strictEqual(toggleOffData.attended, false);

    const toggleOn = await fetch(`${baseUrl}/api/admin/attendance/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId,
        attended: true
      })
    });
    assert.strictEqual(toggleOn.status, 200);
    const toggleOnData = await toggleOn.json();
    assert.strictEqual(toggleOnData.attended, true);
  } finally {
    server.close();
    fs.writeFileSync(STUDENTS_FILE, studentsBak, 'utf8');
    fs.writeFileSync(DATA_FILE, dataBak, 'utf8');
  }
});
