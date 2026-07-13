import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgxarxe1ue8DOgUI3ldbzDv0Mlpyr0jDc",
  authDomain: "examenprogramacionweb1.firebaseapp.com",
  projectId: "examenprogramacionweb1",
  storageBucket: "examenprogramacionweb1.firebasestorage.app",
  messagingSenderId: "558488834978",
  appId: "1:558488834978:web:a6b7349f6b44e8e52fd8fb"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

let alumnos = [];



const referenciaColeccion = collection(db, "alumnos");

onSnapshot(referenciaColeccion, (snapshot) => {
    alumnos = [];

    snapshot.forEach((doc) => {
        const datosAlumno = doc.data();
        
        alumnos.push({
            id: doc.id,
            nombre: datosAlumno.nombre,
            notas: datosAlumno.notas,
            asistencia: datosAlumno.asistencia,
            grado: datosAlumno.grado,
            turno: datosAlumno.turno,
            proyectoEntregado: datosAlumno.proyectoEntregado
        });
    });

    renderizar();
});

function promedioNotas(notas) {
    if (!notas.length) return 0;
    return notas.reduce((a, b) => a + b, 0) / notas.length;
}

async function registrarAlumno() {
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

    try {
        const refColeccion = collection(db, "alumnos");
        
        await addDoc(refColeccion, {
            nombre: nombre,
            notas: notas,
            asistencia: asistencia,
            grado: grado,
            turno: turnoInput.value,
            proyectoEntregado: proyectoEntregado
        });

        console.log("¡Alumno guardado exitosamente en Firestore!");
        document.getElementById('formAlumno').reset();
        
    } catch (error) {
        console.error("Error al guardar el alumno: ", error);
        alert("Hubo un error al guardar en la base de datos.");
    }
}

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

    const promedioGrupalEl = document.getElementById('promedioGrupal');
    if (total === 0) {
        promedioGrupalEl.textContent = '--';
    } else {
        const promedios = alumnos.map(a => promedioNotas(a.notas));
        const promedioGrupal = promedios.reduce((a, b) => a + b, 0) / total;
        promedioGrupalEl.textContent = promedioGrupal.toFixed(2);
    }

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

    const porcentajeProyectosEl = document.getElementById('porcentajeProyectos');
    if (total === 0) {
        porcentajeProyectosEl.textContent = '--';
    } else {
        const entregados = alumnos.filter(a => a.proyectoEntregado).length;
        porcentajeProyectosEl.textContent = Math.round((entregados / total) * 100) + '%';
    }

    const totalManana = alumnos.filter(a => a.turno === 'Mañana').length;
    const totalTarde = alumnos.filter(a => a.turno === 'Tarde').length;
    document.getElementById('totalManana').textContent = totalManana;
    document.getElementById('totalTarde').textContent = totalTarde;

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


document.getElementById('btnGuardar').addEventListener('click', registrarAlumno);