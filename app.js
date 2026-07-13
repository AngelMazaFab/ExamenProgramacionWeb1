let alumnos = [];

function promedioNotas(notas) {
    if (!notas.length) return 0;
    return notas.reduce((a, b) => a + b, 0) / notas.length;
}

function registrarAlumno() {
    const nombre = document.getElementById('nombreAlumno').value.trim();
    const notasTexto = document.getElementById('calificaciones').value;
    const notas = notasTexto
        .split(',')
        .map(n => parseFloat(n.trim()))
        .filter(n => !isNaN(n));
    const asistencia = parseFloat(document.getElementById('porcentajeAsistencia').value);
    const grado = document.getElementById('grado').value;
    const turnoInput = document.querySelector('input[name="turno"]:checked');
    const proyectoEntregado = document.getElementById('proyectoEntregado').checked;

    if (!nombre) {
        alert('Escribe el nombre del alumno.');
        return;
    }
    if (notas.length === 0) {
        alert('Escribe al menos una calificación, separada por comas.');
        return;
    }
    if (isNaN(asistencia) || asistencia < 0 || asistencia > 100) {
        alert('El porcentaje de asistencia debe ser un número entre 0 y 100.');
        return;
    }
    if (!turnoInput) {
        alert('Selecciona un turno.');
        return;
    }

    alumnos.push({
        nombre,
        notas,
        asistencia,
        grado,
        turno: turnoInput.value,
        proyectoEntregado
    });

    document.getElementById('formAlumno').reset();
    renderizar();
}

// Necesitamos exponer esta función globalmente para que el HTML pueda acceder a ella temporalmente,
// porque en HTML tienes onclick="eliminarAlumno(${i})". 
// Más adelante, cuando migremos a Firebase, también mejoraremos esta forma de eliminar.
window.eliminarAlumno = function(indice) {
    alumnos.splice(indice, 1);
    renderizar();
};

function renderizar() {
    const cuerpo = document.getElementById('cuerpoTabla');
    const mensajeVacio = document.getElementById('mensajeVacio');

    cuerpo.innerHTML = alumnos.map((a, i) => `
        <tr>
            <td>${a.nombre}</td>
            <td>${a.grado}<br><small>${a.turno === 'Mañana' ? '☀️' : '🌙'} ${a.turno}</small></td>
            <td>${a.notas.join(', ')}<br><strong>Prom: ${promedioNotas(a.notas).toFixed(2)}</strong></td>
            <td>${a.asistencia}%</td>
            <td>${a.proyectoEntregado
                ? '<span class="badge ok">✓ Sí</span>'
                : '<span class="badge no">✗ No</span>'}</td>
            <td><button class="btn-eliminar" onclick="eliminarAlumno(${i})" title="Eliminar">🗑️</button></td>
        </tr>
    `).join('');

    mensajeVacio.style.display = alumnos.length ? 'none' : 'block';

    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    const total = alumnos.length;

    // Promedio grupal
    const promedioGrupalEl = document.getElementById('promedioGrupal');
    if (total === 0) {
        promedioGrupalEl.textContent = '--';
    } else {
        const promedios = alumnos.map(a => promedioNotas(a.notas));
        const promedioGrupal = promedios.reduce((a, b) => a + b, 0) / total;
        promedioGrupalEl.textContent = promedioGrupal.toFixed(2);
    }

    // Mejor alumno 
    const mejorEstudianteEl = document.getElementById('mejorEstudiante');
    if (total === 0) {
        mejorEstudianteEl.textContent = '--';
    } else {
        let mejor = alumnos[0];
        let mejorProm = promedioNotas(mejor.notas);
        for (const a of alumnos) {
            const p = promedioNotas(a.notas);
            if (p > mejorProm) {
                mejor = a;
                mejorProm = p;
            }
        }
        mejorEstudianteEl.textContent = '👑 ' + mejor.nombre;
    }

    // Entregas de proyecto
    const porcentajeProyectosEl = document.getElementById('porcentajeProyectos');
    if (total === 0) {
        porcentajeProyectosEl.textContent = '--';
    } else {
        const entregados = alumnos.filter(a => a.proyectoEntregado).length;
        porcentajeProyectosEl.textContent = Math.round((entregados / total) * 100) + '%';
    }

    // Distribución por turno
    const totalManana = alumnos.filter(a => a.turno === 'Mañana').length;
    const totalTarde = alumnos.filter(a => a.turno === 'Tarde').length;
    document.getElementById('totalManana').textContent = totalManana;
    document.getElementById('totalTarde').textContent = totalTarde;

    // Alumnos aprobados
    const aprobados = alumnos.filter(a =>
        promedioNotas(a.notas) >= 6 &&
        a.proyectoEntregado &&
        a.asistencia >= 80
    );
    document.getElementById('totalAprobados').textContent = aprobados.length;
    document.getElementById('listaAprobados').innerHTML = aprobados
        .map(a => `<span>✓ ${a.nombre}</span>`)
        .join('');
}

// Inicialización
document.getElementById('btnGuardar').addEventListener('click', registrarAlumno);
renderizar();