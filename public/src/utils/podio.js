// Calculo de posiciones y desempates de actividades finalizadas
export function getActivityPodium(act) {
  if (!act || act.status !== 'Terminada') return null;
  const p = act.pointsAwarded || {};
  const entries = [
    { al: 'Terror', pts: Number(p.Terror || 0) },
    { al: 'Shooter', pts: Number(p.Shooter || 0) },
    { al: 'Action', pts: Number(p.Action || 0) }
  ].sort((a, b) => b.pts - a.pts);

  if (entries[0].pts === entries[1].pts && entries[1].pts === entries[2].pts) {
    return {
      first: 'Empate Triple',
      second: '-',
      third: '-'
    };
  }
  if (entries[0].pts === entries[1].pts) {
    return {
      first: `Empate: ${entries[0].al} y ${entries[1].al}`,
      second: '-',
      third: entries[2].al
    };
  }
  if (entries[1].pts === entries[2].pts) {
    return {
      first: entries[0].al,
      second: `Empate: ${entries[1].al} y ${entries[2].al}`,
      third: '-'
    };
  }

  return {
    first: entries[0].al,
    second: entries[1].al,
    third: entries[2].al
  };
}
