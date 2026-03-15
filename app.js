// Referencias a elementos del DOM para mostrar estado y tabla
const statusEl = document.getElementById("status");
const tableContainer = document.getElementById("tableContainer");

// Referencias a botones que controlan la cantidad de registros a consultar
const btn5 = document.getElementById("btn5");
const btn10 = document.getElementById("btn10");
const btn20 = document.getElementById("btn20");

// Campo de búsqueda para filtrado dinámico por nombre
const searchInput = document.getElementById("searchInput");

// Cache en memoria para almacenar los Pokémon obtenidos desde la API
// Evita realizar múltiples llamadas innecesarias al servidor
let pokemonsCache = [];
let lastLimitLoaded = 0;

/**
 * Habilita o deshabilita los botones de consulta.
 * Se utiliza para evitar múltiples solicitudes simultáneas.
 */
function setButtonsDisabled(disabled) {
  btn5.disabled = disabled;
  btn10.disabled = disabled;
  btn20.disabled = disabled;
}

/**
 * Realiza una solicitud HTTP a PokeAPI para obtener una lista de Pokémon.
 * @param {number} limit Cantidad de registros a recuperar.
 * @returns {Promise<Object>} JSON con los datos obtenidos.
 */
async function obtenerPokemons(limit) {
  const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=0`;
  const response = await fetch(url);

  // Validación del estado de la respuesta HTTP
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

/**
 * Transforma la respuesta JSON en un modelo simplificado
 * que será utilizado para renderizar la tabla.
 */
function procesarDatos(data) {
  // data.results contiene objetos con { name, url }
  return data.results.map((p, index) => ({
    num: index + 1,   // número consecutivo para visualización
    nombre: p.name,
    url: p.url
  }));
}

/**
 * Filtra los Pokémon almacenados en memoria según el texto ingresado.
 * - No distingue mayúsculas/minúsculas.
 * - Elimina espacios innecesarios.
 * - Si el campo está vacío, devuelve todos los registros.
 */
function filtrarPorNombre(query) {
  const q = (query || "").trim().toLowerCase();

  if (!q) return pokemonsCache;

  return pokemonsCache.filter((p) =>
    p.nombre.toLowerCase().includes(q)
  );
}

/**
 * Genera dinámicamente la tabla HTML e inserta los datos filtrados.
 * También actualiza el mensaje de estado para el usuario.
 */
function renderTabla(pokemons, totalBase, query) {

  // Si no hay resultados coincidentes
  if (!pokemons || pokemons.length === 0) {
    const q = (query || "").trim();
    tableContainer.innerHTML = `<div class="empty">No hay resultados para "${q}".</div>`;
    statusEl.textContent = `0 resultados (base: ${totalBase}).`;
    statusEl.className = "status err";
    return;
  }

  // Construcción de filas HTML
  const rowsHtml = pokemons
    .map(
      (p) => `
        <tr>
          <td><span class="badge">#${p.num}</span></td>
          <td>${p.nombre}</td>
          <td><a href="${p.url}" target="_blank" rel="noopener noreferrer">${p.url}</a></td>
        </tr>
      `
    )
    .join("");

  // Estructura completa de la tabla
  const tableHtml = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nombre</th>
          <th>URL (detalle)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  tableContainer.innerHTML = tableHtml;

  // Actualiza el estado mostrando cantidad de resultados
  const q = (query || "").trim();
  if (q) {
    statusEl.textContent = `Mostrando ${pokemons.length} resultado(s) para "${q}" (base: ${totalBase}).`;
  } else {
    statusEl.textContent = `Mostrando ${pokemons.length} Pokémon (base: ${totalBase}).`;
  }
  statusEl.className = "status ok";
}

/**
 * Aplica el filtro actual del campo de búsqueda
 * sobre los datos previamente cargados.
 */
function aplicarFiltroActual() {
  if (!pokemonsCache || pokemonsCache.length === 0) {
    tableContainer.innerHTML = `<div class="empty">Primero selecciona 5, 10 o 20 registros.</div>`;
    statusEl.textContent = "Selecciona una opción";
    statusEl.className = "status";
    return;
  }

  const query = searchInput.value;
  const filtrados = filtrarPorNombre(query);

  renderTabla(filtrados, lastLimitLoaded, query);
}

/**
 * Flujo principal de consulta:
 * 1. Muestra estado de carga.
 * 2. Consulta la API.
 * 3. Procesa los datos recibidos.
 * 4. Guarda los resultados en memoria.
 * 5. Aplica filtro activo si existe.
 * 6. Maneja errores de red o servidor.
 */
async function listarPokemons(limit) {
  try {
    setButtonsDisabled(true);

    statusEl.textContent = "Cargando...";
    statusEl.className = "status";
    tableContainer.innerHTML = `<div class="empty">Cargando datos...</div>`;

    const data = await obtenerPokemons(limit);
    pokemonsCache = procesarDatos(data);
    lastLimitLoaded = limit;

    // Aplica filtro automáticamente si el usuario ya escribió algo
    aplicarFiltroActual();

  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    statusEl.className = "status err";
    tableContainer.innerHTML = `<div class="empty">No se pudo cargar la información.</div>`;
  } finally {
    setButtonsDisabled(false);
  }
}

/** Eventos de los botones para cargar datos desde la API */
btn5.addEventListener("click", () => listarPokemons(5));
btn10.addEventListener("click", () => listarPokemons(10));
btn20.addEventListener("click", () => listarPokemons(20));

/**
 * Evento de búsqueda dinámica.
 * Se ejecuta cada vez que el usuario escribe,
 * filtrando los resultados en tiempo real.
 */
searchInput.addEventListener("input", () => {
  aplicarFiltroActual();
});
