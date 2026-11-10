# -*- coding: utf-8 -*-
"""
Script de gestión de datos: Limpieza y Simulación
Semana de la Carrera 2026 - INACAP Sede Antofagasta
"""

import sys
import json
import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data.json')
STUDENTS_FILE = os.path.join(BASE_DIR, 'students.json')
BACKUP_FILE = os.path.join(BASE_DIR, 'data_backup.json')

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def backup_data():
    if os.path.exists(DATA_FILE):
        shutil.copyfile(DATA_FILE, BACKUP_FILE)

def clean_all_data():
    """Restaura data.json al estado 100% oficial previo al evento (todo en cero y pendiente)."""
    backup_data()
    data = load_json(DATA_FILE)

    # 1. Reset Actividades del Día 19
    for act in data.get('activities', []):
        act['status'] = 'Pendiente'
        act['notes'] = ''
        act['pointsAwarded'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}
        if 'results' in act:
            act['results'] = {'Terror': null_safe(), 'Shooter': null_safe(), 'Action': null_safe()}
        if 'participantCards' in act:
            act['participantCards'] = {'Terror': [], 'Shooter': [], 'Action': []}
            act['averages'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}
        if 'matches' in act:
            for m in act['matches']:
                m['score1'] = None
                m['score2'] = None
        if 'table' in act:
            for team in ['Terror', 'Shooter', 'Action']:
                act['table'][team] = {
                    'pts': 0, 'pj': 0, 'pg': 0, 'pe': 0, 'pp': 0,
                    'gf': 0, 'gc': 0, 'dg': 0, 'rank': None
                }

    # 2. Reset Desafíos Creativos
    if 'creativeChallenges' in data:
        cc = data['creativeChallenges']
        cc['favoriteAlliance'] = None
        cc['pointsAwarded'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}
        for al in ['Terror', 'Shooter', 'Action']:
            if 'status' in cc and al in cc['status']:
                cc['status'][al] = {'delivered': False, 'deliveryTime': None, 'evaluated': False}
            if 'rubrics' in cc and al in cc['rubrics']:
                rub = cc['rubrics'][al]
                rub['docente1'] = {}
                rub['docente2'] = {}
                rub['docente1Nota'] = None
                rub['docente2Nota'] = None
                rub['notaPromedio'] = None
                rub['discrepancyAlert'] = False

    # 3. Reset Copa Tarreo
    if 'tarreoCopa' in data:
        tc = data['tarreoCopa']
        if 'cazatesoros' in tc:
            tc['cazatesoros']['status'] = 'Pendiente'
            tc['cazatesoros']['tesoros'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}
            tc['cazatesoros']['allZeroTie'] = False
            tc['cazatesoros']['pointsAwarded'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}
        if 'justdance' in tc:
            tc['justdance']['status'] = 'Pendiente'
            tc['justdance']['places'] = {'Terror': None, 'Shooter': None, 'Action': None}
            tc['justdance']['pointsAwarded'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}
        if 'mimica' in tc:
            tc['mimica']['status'] = 'Pendiente'
            tc['mimica']['places'] = {'Terror': None, 'Shooter': None, 'Action': None}
            tc['mimica']['pointsAwarded'] = {'Terror': 0, 'Shooter': 0, 'Action': 0}

    # 4. Reset Participantes por Actividad
    if 'activityParticipants' in data:
        for act_id, act_part in data['activityParticipants'].items():
            act_part['isClosed'] = False
            act_part['closedAt'] = None
            act_part['closedBy'] = None
            act_part['lists'] = {'Terror': [], 'Shooter': [], 'Action': []}
            act_part['audit'] = []

    # 5. Reset Tarreo Individual
    if 'tarreoIndividual' in data:
        data['tarreoIndividual'] = {
            'fortniteSignups': [],
            'fortniteWaitlist': [],
            'valorantSignups': [],
            'brawlSignups': [],
            'minecraftSignups': [],
            'leaderboard': []
        }

    # 6. Reset Auditoría, Sanciones, Reclamos y Sorpresas
    data['sorpresas'] = []
    data['sanciones'] = []
    data['reclamos'] = []
    data['auditLogs'] = []

    # 7. Reset Cronología de Tiempos
    if 'activityScheduleLogs' in data:
        for act_id, s in data['activityScheduleLogs'].items():
            s['actualStart'] = None
            s['actualEnd'] = None
            s['durationMin'] = None
            s['deviationMin'] = None
            s['status'] = 'Programado / Por iniciar'

    # 8. Reset Resultados Tarreo & Seguridad
    data['tarreoResults'] = {
        'attendance': {
            'day19': 0,
            'day20_tarreo_registered': 0,
            'day20_tarreo_attended': 0,
            'day20_tarreo_noShows': 0,
            'day21_closing': 0
        },
        'individualTournaments': [
            { 'game': 'Valorant (5v5 Spike Rush)', 'champion': 'Por disputar', 'runnerUp': 'Por disputar', 'participants': 0 },
            { 'game': 'Fortnite (Battle Royale Solo)', 'champion': 'Por disputar', 'runnerUp': 'Por disputar', 'participants': 0 },
            { 'game': 'Super Smash Bros Brawl (Wii)', 'champion': 'Por disputar', 'runnerUp': 'Por disputar', 'participants': 0 },
            { 'game': 'Minecraft Speedrun Challenge', 'champion': 'Por disputar', 'runnerUp': 'Por disputar', 'participants': 0 }
        ],
        'mvp': {
            'studentName': 'Por definir',
            'alliance': '-',
            'carrera': '-',
            'achievement': 'Pendiente de votación al cierre de la noche gamer'
        },
        'security': {
            'expulsions': 0,
            'emergencyExits': 0,
            'minorInfractions': 0,
            'notes': 'Sin incidencias registradas.'
        }
    }

    # 9. Reset Recursos e Incidentes Técnicos
    if 'logisticsResources' in data:
        for r in data['logisticsResources']:
            r['status'] = 'Solicitado / En preparación'
    data['technicalIncidents'] = []

    # Guardar cambios
    save_json(DATA_FILE, data)
    print("\n[OK] data.json ha sido RESTABLECIDO EXITOSAMENTE a su estado oficial limpio.")
    print("     - Puntos en cero para todas las alianzas.")
    print("     - Actividades en estado 'Pendiente'.")
    print("     - Listas de participantes en cancha vacías (0 en padrón).")
    print("     - Bitácora de incidentes y sanciones limpia.")

def null_safe():
    return None

def simulate_full_data():
    """Carga una simulación completa, realista y coherente con las bases oficiales para demostración."""
    backup_data()
    data = load_json(DATA_FILE)
    students = load_json(STUDENTS_FILE)

    # Filtrar estudiantes por alianza
    terror_stus = [s for s in students if s['alliance'] == 'Terror']
    shooter_stus = [s for s in students if s['alliance'] == 'Shooter']
    action_stus = [s for s in students if s['alliance'] == 'Action']

    def add_p(act_id, al, stu, score=None):
        if act_id in data['activityParticipants']:
            data['activityParticipants'][act_id]['lists'][al].append({
                'studentId': stu['id'],
                'name': stu['name'],
                'carrera': stu.get('carrera', ''),
                'alliance': al,
                'score': score,
                'addedAt': '2026-11-19T10:15:00.000Z',
                'addedBy': 'Staff Mesa',
                'correctionReason': None
            })

    # Limpiar participantes previos
    for act_part in data['activityParticipants'].values():
        act_part['lists'] = {'Terror': [], 'Shooter': [], 'Action': []}
        act_part['isClosed'] = True
        act_part['closedAt'] = '2026-11-19T13:00:00.000Z'
        act_part['closedBy'] = 'Encargado de Mesa'

    # 1. Torneo Retro (Mortal Kombat, cupo 5) -> Terror gana
    for s in terror_stus[:5]: add_p('retro', 'Terror', s)
    for s in shooter_stus[:5]: add_p('retro', 'Shooter', s)
    for s in action_stus[:5]: add_p('retro', 'Action', s)
    retro = next((a for a in data['activities'] if a['id'] == 'retro'), None)
    if retro:
        retro['status'] = 'Terminada'
        retro['results'] = {'Terror': 1, 'Shooter': 2, 'Action': 3}
        retro['pointsAwarded'] = {'Terror': 3000, 'Shooter': 1800, 'Action': 900}

    # 2. Taca-taca y ping pong (duplas por alianza) -> Shooter gana taca-taca, Terror gana ping pong
    for s in terror_stus[5:7]: add_p('tacataca', 'Terror', s)
    for s in shooter_stus[5:7]: add_p('tacataca', 'Shooter', s)
    for s in action_stus[5:7]: add_p('tacataca', 'Action', s)
    tt = next((a for a in data['activities'] if a['id'] == 'tacataca'), None)
    if tt:
        tt['status'] = 'Terminada'
        tt['results'] = {'Shooter': 1, 'Action': 2, 'Terror': 3}
        tt['pointsAwarded'] = {'Shooter': 1000, 'Action': 600, 'Terror': 300}

    for s in terror_stus[7:9]: add_p('pingpong', 'Terror', s)
    for s in shooter_stus[7:9]: add_p('pingpong', 'Shooter', s)
    for s in action_stus[7:9]: add_p('pingpong', 'Action', s)
    pp = next((a for a in data['activities'] if a['id'] == 'pingpong'), None)
    if pp:
        pp['status'] = 'Terminada'
        pp['results'] = {'Terror': 1, 'Shooter': 2, 'Action': 3}
        pp['pointsAwarded'] = {'Terror': 1000, 'Shooter': 600, 'Action': 300}

    # 3. Gymkanas (puntuación nominal 0 a 8)
    t_gym = [8, 7, 8, 6, 8, 7]
    s_gym = [8, 8, 8, 7, 8, 8]
    a_gym = [6, 7, 6, 8, 7, 6]
    for i, s in enumerate(terror_stus[9:15]): add_p('gymkanas', 'Terror', s, t_gym[i])
    for i, s in enumerate(shooter_stus[9:15]): add_p('gymkanas', 'Shooter', s, s_gym[i])
    for i, s in enumerate(action_stus[9:15]): add_p('gymkanas', 'Action', s, a_gym[i])
    gym = next((a for a in data['activities'] if a['id'] == 'gymkanas'), None)
    if gym:
        gym['status'] = 'Terminada'
        gym['participantCards'] = {'Terror': t_gym, 'Shooter': s_gym, 'Action': a_gym}
        gym['averages'] = {'Terror': 7.33, 'Shooter': 7.83, 'Action': 6.67}
        gym['pointsAwarded'] = {
            'Terror': round(3000 * (7.33 / 8)),
            'Shooter': round(3000 * (7.83 / 8)),
            'Action': round(3000 * (6.67 / 8))
        }

    # 4. Baby Fútbol (5 por equipo)
    for s in terror_stus[15:20]: add_p('babyfutbol', 'Terror', s)
    for s in shooter_stus[15:20]: add_p('babyfutbol', 'Shooter', s)
    for s in action_stus[15:20]: add_p('babyfutbol', 'Action', s)
    bf = next((a for a in data['activities'] if a['id'] == 'babyfutbol'), None)
    if bf:
        bf['status'] = 'Terminada'
        bf['matches'] = [
            {'team1': 'Terror', 'team2': 'Shooter', 'score1': 3, 'score2': 2},
            {'team1': 'Shooter', 'team2': 'Action', 'score1': 4, 'score2': 1},
            {'team1': 'Action', 'team2': 'Terror', 'score1': 0, 'score2': 2}
        ]
        bf['table'] = {
            'Terror': {'pts': 6, 'pj': 2, 'pg': 2, 'pe': 0, 'pp': 0, 'gf': 5, 'gc': 2, 'dg': 3, 'rank': 1},
            'Shooter': {'pts': 3, 'pj': 2, 'pg': 1, 'pe': 0, 'pp': 1, 'gf': 6, 'gc': 4, 'dg': 2, 'rank': 2},
            'Action': {'pts': 0, 'pj': 2, 'pg': 0, 'pe': 0, 'pp': 2, 'gf': 1, 'gc': 6, 'dg': -5, 'rank': 3}
        }
        bf['pointsAwarded'] = {'Terror': 4000, 'Shooter': 2400, 'Action': 1200}

    # 5. Quemadas (8 por equipo)
    for s in terror_stus[20:28]: add_p('quemadas', 'Terror', s)
    for s in shooter_stus[20:28]: add_p('quemadas', 'Shooter', s)
    for s in action_stus[20:28]: add_p('quemadas', 'Action', s)
    qm = next((a for a in data['activities'] if a['id'] == 'quemadas'), None)
    if qm:
        qm['status'] = 'Terminada'
        qm['matches'] = [
            {'team1': 'Terror', 'team2': 'Shooter', 'score1': 2, 'score2': 1},
            {'team1': 'Shooter', 'team2': 'Action', 'score1': 2, 'score2': 0},
            {'team1': 'Action', 'team2': 'Terror', 'score1': 2, 'score2': 1}
        ]
        qm['table'] = {
            'Terror': {'pts': 6, 'pj': 2, 'pg': 2, 'pe': 0, 'pp': 0, 'gf': 4, 'gc': 2, 'dg': 2, 'rank': 1},
            'Shooter': {'pts': 3, 'pj': 2, 'pg': 1, 'pe': 0, 'pp': 1, 'gf': 3, 'gc': 2, 'dg': 1, 'rank': 2},
            'Action': {'pts': 0, 'pj': 2, 'pg': 0, 'pe': 0, 'pp': 2, 'gf': 1, 'gc': 4, 'dg': -3, 'rank': 3}
        }
        qm['pointsAwarded'] = {'Terror': 4000, 'Shooter': 2400, 'Action': 1200}

    # 6. Trivia (3 por alianza)
    for s in terror_stus[28:31]: add_p('trivia', 'Terror', s)
    for s in shooter_stus[28:31]: add_p('trivia', 'Shooter', s)
    for s in action_stus[21:24]: add_p('trivia', 'Action', s)
    tr = next((a for a in data['activities'] if a['id'] == 'trivia'), None)
    if tr:
        tr['status'] = 'Terminada'
        tr['results'] = {'Shooter': 1, 'Terror': 2, 'Action': 3}
        tr['pointsAwarded'] = {'Shooter': 2000, 'Terror': 1200, 'Action': 600}

    # 7. Canto (8 por alianza)
    for s in terror_stus[31:39]: add_p('canto', 'Terror', s)
    for s in shooter_stus[31:39]: add_p('canto', 'Shooter', s)
    for s in action_stus[10:18]: add_p('canto', 'Action', s)
    ca = next((a for a in data['activities'] if a['id'] == 'canto'), None)
    if ca:
        ca['status'] = 'Terminada'
        ca['results'] = {'Terror': 1, 'Action': 2, 'Shooter': 3}
        ca['pointsAwarded'] = {'Terror': 1500, 'Action': 900, 'Shooter': 450}

    # 8. Barra
    ba = next((a for a in data['activities'] if a['id'] == 'barra'), None)
    if ba:
        ba['status'] = 'Terminada'
        ba['results'] = {'Terror': 1, 'Shooter': 2, 'Action': 3}
        ba['pointsAwarded'] = {'Terror': 1500, 'Shooter': 900, 'Action': 450}

    # Desafíos Creativos
    cc = data['creativeChallenges']
    cc['favoriteAlliance'] = 'Terror'
    for al in ['Terror', 'Shooter', 'Action']:
        cc['status'][al] = {'delivered': True, 'deliveryTime': '2026-11-19T11:45:00.000Z', 'evaluated': True}
        rub = cc['rubrics'][al]
        if al == 'Terror':
            rub['docente1Nota'] = 96
            rub['docente2Nota'] = 94
            rub['notaPromedio'] = 95
            rub['discrepancyAlert'] = False
            cc['pointsAwarded']['Terror'] = 1000 + round(95 * 25) + 500 # 3.875 pts
        elif al == 'Shooter':
            rub['docente1Nota'] = 88
            rub['docente2Nota'] = 92
            rub['notaPromedio'] = 90
            rub['discrepancyAlert'] = False
            cc['pointsAwarded']['Shooter'] = 1000 + round(90 * 25) # 3.250 pts
        else:
            rub['docente1Nota'] = 86
            rub['docente2Nota'] = 84
            rub['notaPromedio'] = 85
            rub['discrepancyAlert'] = False
            cc['pointsAwarded']['Action'] = 1000 + round(85 * 25) # 3.125 pts

    # Copa Tarreo
    tc = data['tarreoCopa']
    tc['cazatesoros']['status'] = 'Terminada'
    tc['cazatesoros']['tesoros'] = {'Shooter': 14, 'Terror': 11, 'Action': 6}
    tc['cazatesoros']['pointsAwarded'] = {'Shooter': 1500, 'Terror': 900, 'Action': 450}

    tc['justdance']['status'] = 'Terminada'
    tc['justdance']['places'] = {'Action': 1, 'Shooter': 2, 'Terror': 3}
    tc['justdance']['pointsAwarded'] = {'Action': 1500, 'Shooter': 900, 'Terror': 450}

    tc['mimica']['status'] = 'Terminada'
    tc['mimica']['places'] = {'Terror': 1, 'Shooter': 2, 'Action': 3}
    tc['mimica']['pointsAwarded'] = {'Terror': 1000, 'Shooter': 600, 'Action': 300}

    # Cronología de Tiempos
    data['activityScheduleLogs'] = {
        'retro': { 'name': 'Torneo retro (Mortal Kombat)', 'planned': '10:00 - 11:00 (60 min)', 'actualStart': '10:05', 'actualEnd': '11:00', 'durationMin': 55, 'deviationMin': -5, 'status': 'Cumplido en tiempo' },
        'tacataca': { 'name': 'Taca-taca', 'planned': '10:30 - 11:30 (60 min)', 'actualStart': '10:35', 'actualEnd': '11:25', 'durationMin': 50, 'deviationMin': -10, 'status': 'Cumplido en tiempo' },
        'pingpong': { 'name': 'Ping pong', 'planned': '10:30 - 11:30 (60 min)', 'actualStart': '10:35', 'actualEnd': '11:25', 'durationMin': 50, 'deviationMin': -10, 'status': 'Cumplido en tiempo' },
        'gymkanas': { 'name': 'Gymkanas en cancha', 'planned': '09:30 - 11:30 (120 min)', 'actualStart': '09:35', 'actualEnd': '11:30', 'durationMin': 115, 'deviationMin': -5, 'status': 'Cumplido en tiempo' },
        'babyfutbol': { 'name': 'Baby fútbol', 'planned': '11:15 - 12:00 (45 min)', 'actualStart': '11:20', 'actualEnd': '12:05', 'durationMin': 45, 'deviationMin': 0, 'status': 'Cumplido exacto' },
        'quemadas': { 'name': 'Quemadas', 'planned': '11:55 - 12:40 (45 min)', 'actualStart': '12:05', 'actualEnd': '12:48', 'durationMin': 43, 'deviationMin': -2, 'status': 'Cumplido en tiempo' },
        'trivia': { 'name': 'Trivia de carrera', 'planned': '10:15 - 10:30 (15 min)', 'actualStart': '10:20', 'actualEnd': '10:35', 'durationMin': 15, 'deviationMin': 0, 'status': 'Cumplido exacto' },
        'canto': { 'name': 'Si te la sabes, canta', 'planned': '12:40 - 12:55 (15 min)', 'actualStart': '12:50', 'actualEnd': '13:05', 'durationMin': 15, 'deviationMin': 0, 'status': 'Cumplido exacto' },
        'barra': { 'name': 'Barra y decibelímetro', 'planned': '3 mediciones (180 min)', 'actualStart': '10:00', 'actualEnd': '13:00', 'durationMin': 180, 'deviationMin': 0, 'status': 'Cumplido exacto' }
    }

    # Tarreo Resultados & Seguridad
    data['tarreoResults'] = {
        'attendance': {
            'day19': 214,
            'day20_tarreo_registered': 48,
            'day20_tarreo_attended': 45,
            'day20_tarreo_noShows': 3,
            'day21_closing': 185
        },
        'individualTournaments': [
            { 'game': 'Valorant (5v5 Spike Rush)', 'champion': 'Equipo Terror Alpha', 'runnerUp': 'Equipo Shooter Delta', 'participants': 20 },
            { 'game': 'Fortnite (Battle Royale Solo)', 'champion': 'Matías Rojas (Shooter)', 'runnerUp': 'Ignacio Torres (Terror)', 'participants': 12 },
            { 'game': 'Super Smash Bros Brawl (Wii)', 'champion': 'Felipe Cortés (Action)', 'runnerUp': 'Sebastián Brito (Terror)', 'participants': 16 },
            { 'game': 'Minecraft Speedrun Challenge', 'champion': 'Cristóbal Vega (Shooter)', 'runnerUp': 'Rodrigo Silva (Action)', 'participants': 10 }
        ],
        'mvp': {
            'studentName': 'Matías Rojas',
            'alliance': 'Shooter',
            'carrera': 'Ingeniería en Informática',
            'achievement': 'Campeón invicto en Fortnite Solo y clutch decisivo en la final de Valorant'
        },
        'security': {
            'expulsions': 0,
            'emergencyExits': 0,
            'minorInfractions': 1,
            'notes': 'Jornada nocturna 100% segura y bajo control. Una sola advertencia verbal en pasillo exterior corregida de inmediato.'
        }
    }

    # Recursos e Incidentes Técnicos
    data['logisticsResources'] = [
        { 'id': 1, 'item': 'Mesas de Ping Pong y Taca-Taca (2 unidades)', 'provider': 'DAE', 'status': 'Operativo / Devuelto', 'responsible': 'Encargado de Deportes DAE' },
        { 'id': 2, 'item': 'Balones blandos certificados (Baby fútbol y Quemadas)', 'provider': 'DAE', 'status': 'Operativo / Devuelto', 'responsible': 'Pañol DAE' },
        { 'id': 3, 'item': 'Controles Arcade USB y Proyector Cancha', 'provider': 'Jefatura de Carrera', 'status': 'Operativo / Resguardado', 'responsible': 'Coordinación Informática' },
        { 'id': 4, 'item': 'Switches Gigabit y cableado estructurado Tarreo', 'provider': 'Jefatura de Carrera', 'status': 'Operativo / Resguardado', 'responsible': 'Soporte Técnico Informática' },
        { 'id': 5, 'item': 'Consola Wii, mandos y sensores Just Dance', 'provider': 'Delegación Estudiantil', 'status': 'Operativo / Devuelto', 'responsible': 'Delegados de Alianza' },
        { 'id': 6, 'item': 'Sistema de amplificación y micrófonos inalámbricos', 'provider': 'Sede Antofagasta', 'status': 'Operativo / Devuelto', 'responsible': 'Audiovisual Sede' }
    ]
    data['technicalIncidents'] = [
        { 'id': 1, 'timestamp': '19 Nov 10:15', 'category': 'Conectividad', 'description': 'Microcorte de señal Wi-Fi en sector arcade', 'resolution': 'Conexión a switch cableado de soporte en 3 min', 'status': 'Resuelto' },
        { 'id': 2, 'timestamp': '20 Nov 23:30', 'category': 'Equipos', 'description': 'Falla de cable HDMI en proyector secundario de Wii', 'resolution': 'Reemplazo inmediato por repuesto de pañol DAE en 2 min', 'status': 'Resuelto' }
    ]

    save_json(DATA_FILE, data)
    print("\n[OK] DATOS SIMULADOS CARGADOS EXITOSAMENTE para presentación y demo.")
    print("     - Puntos y partidos calculados con reglas oficiales.")
    print("     - 74 participantes reales distribuidos en listas de cancha.")
    print("     - Tiempos de ejecución, desafíos creativos y Copa Tarreo poblados.")
    print("     - Métricas del Dashboard listas para mostrar a Jefatura.")

def print_status():
    data = load_json(DATA_FILE)
    students = load_json(STUDENTS_FILE)

    print("\n=======================================================")
    print("  ESTADO ACTUAL DE LA BASE DE DATOS (data.json)")
    print("=======================================================")
    print(f"Total Estudiantes Oficiales en Padrón: {len(students)}")
    
    # Participantes en cancha
    unique_p = set()
    for act in data.get('activityParticipants', {}).values():
        for al in ['Terror', 'Shooter', 'Action']:
            for p in act.get('lists', {}).get(al, []):
                unique_p.add(p.get('studentId'))
    print(f"Participantes Únicos anotados en Cancha: {len(unique_p)}")

    # Puntos por actividad
    print("\nEstado de Actividades del Día 19:")
    completed = 0
    for act in data.get('activities', []):
        st = act.get('status', 'Pendiente')
        if st == 'Terminada': completed += 1
        pts = act.get('pointsAwarded', {})
        print(f" - {act['name']} [{st}]: Terror {pts.get('Terror',0)} | Shooter {pts.get('Shooter',0)} | Action {pts.get('Action',0)}")
    print(f"Total Actividades Terminadas: {completed} de {len(data.get('activities', []))}")

    # Incidentes
    incidents = len(data.get('technicalIncidents', []))
    print(f"\nIncidentes Técnicos registrados: {incidents}")
    print("=======================================================\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print_status()
    elif sys.argv[1] == '--clean':
        clean_all_data()
    elif sys.argv[1] == '--simulate':
        simulate_full_data()
    elif sys.argv[1] == '--status':
        print_status()
    else:
        print("Uso: python manage_data.py [--clean | --simulate | --status]")
