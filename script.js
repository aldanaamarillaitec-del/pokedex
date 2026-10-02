/* =========================================================
   CONFIGURACIÓN
========================================================= */

const API_URL = "https://pokeapi.co/api/v2";

const POKEMON_PER_PAGE = 20;

let allPokemon = [];

let displayedPokemon = [];

let currentOffset = 0;

let currentPokemon = null;

let showingFavorites = false;

let favorites =
    JSON.parse(
        localStorage.getItem("pokemonFavorites")
    ) || [];


/* =========================================================
   ELEMENTOS DOM
========================================================= */

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const clearSearch =
    document.getElementById("clearSearch");

const suggestions =
    document.getElementById("suggestions");

const typeFilter =
    document.getElementById("typeFilter");

const sortFilter =
    document.getElementById("sortFilter");

const randomButton =
    document.getElementById("randomButton");

const pokemonGrid =
    document.getElementById("pokemonGrid");

const loading =
    document.getElementById("loading");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");

const loadMoreButton =
    document.getElementById("loadMoreButton");

const resultsTitle =
    document.getElementById("resultsTitle");

const resultsInfo =
    document.getElementById("resultsInfo");

const favoritesButton =
    document.getElementById("favoritesButton");

const favoritesCount =
    document.getElementById("favoritesCount");

const themeButton =
    document.getElementById("themeButton");


/* MODAL */

const pokemonModal =
    document.getElementById("pokemonModal");

const closeModal =
    document.getElementById("closeModal");

const modalPokemonId =
    document.getElementById("modalPokemonId");

const modalPokemonName =
    document.getElementById("modalPokemonName");

const modalTypes =
    document.getElementById("modalTypes");

const modalPokemonImage =
    document.getElementById("modalPokemonImage");

const modalHeight =
    document.getElementById("modalHeight");

const modalWeight =
    document.getElementById("modalWeight");

const modalExperience =
    document.getElementById("modalExperience");

const modalTotalStats =
    document.getElementById("modalTotalStats");

const modalStats =
    document.getElementById("modalStats");

const modalAbilities =
    document.getElementById("modalAbilities");

const modalFavorite =
    document.getElementById("modalFavorite");

const toast =
    document.getElementById("toast");


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    loadTheme();

    updateFavoritesCounter();

    await loadPokemon();

}


/* =========================================================
   CARGAR POKÉMON
========================================================= */

async function loadPokemon() {

    showLoading();

    hideError();

    try {

        const response = await fetch(
            `${API_URL}/pokemon?limit=${POKEMON_PER_PAGE}&offset=${currentOffset}`
        );

        if (!response.ok) {

            throw new Error(
                "Error cargando Pokémon"
            );
        }

        const data =
            await response.json();


        const pokemonDetails =
            await Promise.all(
                data.results.map(
                    pokemon =>
                        fetchPokemon(
                            pokemon.name
                        )
                )
            );


        allPokemon = [
            ...allPokemon,
            ...pokemonDetails
        ];


        currentOffset +=
            POKEMON_PER_PAGE;


        applyFilters();


        if (
            data.next === null
        ) {

            loadMoreButton.classList.add(
                "hidden"
            );

        } else {

            loadMoreButton.classList.remove(
                "hidden"
            );

        }


    } catch (error) {

        console.error(error);

        showError();

    } finally {

        hideLoading();

    }

}


/* =========================================================
   OBTENER POKÉMON
========================================================= */

async function fetchPokemon(name) {

    const cacheKey =
        `pokemon_${name}`;


    const cached =
        localStorage.getItem(
            cacheKey
        );


    if (cached) {

        try {

            return JSON.parse(cached);

        } catch {

            localStorage.removeItem(
                cacheKey
            );

        }

    }


    const response =
        await fetch(
            `${API_URL}/pokemon/${name}`
        );


    if (!response.ok) {

        throw new Error(
            `No se pudo obtener ${name}`
        );

    }


    const pokemon =
        await response.json();


    try {

        localStorage.setItem(
            cacheKey,
            JSON.stringify(pokemon)
        );

    } catch {

        // El almacenamiento puede estar lleno.
    }


    return pokemon;

}


/* =========================================================
   RENDERIZAR GRID
========================================================= */

function renderPokemon(pokemonList) {

    pokemonGrid.innerHTML = "";

    pokemonList.forEach(
        (pokemon, index) => {

            const card =
                createPokemonCard(
                    pokemon,
                    index
                );

            pokemonGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREAR CARD
========================================================= */

function createPokemonCard(
    pokemon,
    index
) {

    const card =
        document.createElement("article");

    card.className =
        "pokemon-card";


    card.style.animationDelay =
        `${Math.min(index * 0.03, 0.4)}s`;


    const primaryType =
        pokemon.types[0].type.name;


    const image =
        getPokemonImage(pokemon);


    const isFavorite =
        favorites.includes(
            pokemon.id
        );


    card.innerHTML = `

        <div
            class="card-image"
            style="--card-color: ${getTypeColor(primaryType)}"
        >

            <span class="card-id">
                #${formatId(pokemon.id)}
            </span>

            <button
                class="favorite-button"
                data-favorite="${pokemon.id}"
                type="button"
                aria-label="Agregar a favoritos"
            >
                ${isFavorite ? "❤️" : "♡"}
            </button>

            <img
                src="${image}"
                alt="${capitalize(pokemon.name)}"
                loading="lazy"
            >

        </div>

        <div class="card-body">

            <h3 class="card-name">
                ${capitalize(pokemon.name)}
            </h3>

            <div class="types">
                ${createTypesHTML(
                    pokemon.types
                )}
            </div>

        </div>
    `;


    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".favorite-button"
                )
            ) {

                return;

            }

            openModal(pokemon);

        }
    );


    const favoriteBtn =
        card.querySelector(
            ".favorite-button"
        );


    favoriteBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleFavorite(
                pokemon.id
            );

            favoriteBtn.textContent =
                favorites.includes(
                    pokemon.id
                )
                    ? "❤️"
                    : "♡";

        }
    );


    return card;

}


/* =========================================================
   FILTROS
========================================================= */

function applyFilters() {

    let result =
        [...allPokemon];


    const type =
        typeFilter.value;


    if (type !== "all") {

        result =
            result.filter(
                pokemon =>
                    pokemon.types.some(
                        item =>
                            item.type.name === type
                    )
            );

    }


    const sort =
        sortFilter.value;


    result.sort(
        (a, b) => {

            switch (sort) {

                case "name":

                    return a.name.localeCompare(
                        b.name
                    );


                case "hp":

                    return getStat(
                        b,
                        "hp"
                    ) - getStat(
                        a,
                        "hp"
                    );


                case "attack":

                    return getStat(
                        b,
                        "attack"
                    ) - getStat(
                        a,
                        "attack"
                    );


                case "defense":

                    return getStat(
                        b,
                        "defense"
                    ) - getStat(
                        a,
                        "defense"
                    );


                case "speed":

                    return getStat(
                        b,
                        "speed"
                    ) - getStat(
                        a,
                        "speed"
                    );


                default:

                    return a.id - b.id;

            }

        }
    );


    displayedPokemon =
        result;


    renderPokemon(
        displayedPokemon
    );


    updateResultsInfo();

}


/* =========================================================
   BUSCAR
========================================================= */

async function searchPokemon() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {

        applyFilters();

        return;

    }


    showLoading();

    hideError();


    try {

        const pokemon =
            await fetchPokemon(
                query
            );


        displayedPokemon =
            [pokemon];


        resultsTitle.textContent =
            "Resultado de búsqueda";


        resultsInfo.textContent =
            `Encontrado: ${capitalize(
                pokemon.name
            )}`;


        renderPokemon(
            displayedPokemon
        );


        loadMoreButton.classList.add(
            "hidden"
        );


    } catch (error) {

        pokemonGrid.innerHTML = "";

        showError();

        loadMoreButton.classList.add(
            "hidden"
        );

    } finally {

        hideLoading();

    }

}


/* =========================================================
   AUTOCOMPLETADO
========================================================= */

searchInput.addEventListener(
    "input",
    handleSearchInput
);


function handleSearchInput() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    clearSearch.classList.toggle(
        "hidden",
        !query
    );


    if (
        query.length < 2 ||
        allPokemon.length === 0
    ) {

        suggestions.classList.add(
            "hidden"
        );

        return;

    }


    const matches =
        allPokemon
            .filter(
                pokemon =>
                    pokemon.name
                        .includes(query)
                    ||
                    String(
                        pokemon.id
                    ).includes(query)
            )
            .slice(0, 5);


    if (
        matches.length === 0
    ) {

        suggestions.classList.add(
            "hidden"
        );

        return;

    }


    suggestions.innerHTML =
        matches
            .map(
                pokemon => `

                <div
                    class="suggestion"
                    data-name="${pokemon.name}"
                >

                    <img
                        src="${getPokemonImage(
                            pokemon
                        )}"
                        alt=""
                    >

                    <div>

                        <div class="suggestion-name">
                            ${capitalize(
                                pokemon.name
                            )}
                        </div>

                        <div class="suggestion-id">
                            #${formatId(
                                pokemon.id
                            )}
                        </div>

                    </div>

                </div>

            `
            )
            .join("");


    suggestions.classList.remove(
        "hidden"
    );


    document
        .querySelectorAll(
            ".suggestion"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        searchInput.value =
                            item.dataset.name;

                        suggestions.classList.add(
                            "hidden"
                        );

                        searchPokemon();

                    }
                );

            }
        );

}


/* =========================================================
   LIMPIAR BÚSQUEDA
========================================================= */

clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        clearSearch.classList.add(
            "hidden"
        );

        suggestions.classList.add(
            "hidden"
        );

        showingFavorites = false;

        applyFilters();

        loadMoreButton.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   EVENTOS DE BÚSQUEDA
========================================================= */

searchButton.addEventListener(
    "click",
    searchPokemon
);


searchInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            suggestions.classList.add(
                "hidden"
            );

            searchPokemon();

        }

    }
);


/* =========================================================
   FILTROS
========================================================= */

typeFilter.addEventListener(
    "change",
    () => {

        showingFavorites = false;

        applyFilters();

    }
);


sortFilter.addEventListener(
    "change",
    applyFilters
);


/* =========================================================
   CARGAR MÁS
========================================================= */

loadMoreButton.addEventListener(
    "click",
    async () => {

        if (
            showingFavorites
        ) {

            return;

        }

        await loadPokemon();

    }
);


/* =========================================================
   RANDOM
========================================================= */

randomButton.addEventListener(
    "click",
    async () => {

        const randomId =
            Math.floor(
                Math.random() * 1025
            ) + 1;


        searchInput.value =
            String(randomId);


        await searchPokemon();

    }
);


/* =========================================================
   FAVORITOS
========================================================= */

function toggleFavorite(id) {

    const index =
        favorites.indexOf(id);


    if (index === -1) {

        favorites.push(id);

        showToast(
            "❤️ Pokémon agregado a favoritos"
        );

    } else {

        favorites.splice(
            index,
            1
        );

        showToast(
            "Pokémon eliminado de favoritos"
        );

    }


    localStorage.setItem(
        "pokemonFavorites",
        JSON.stringify(
            favorites
        )
    );


    updateFavoritesCounter();

}


function updateFavoritesCounter() {

    favoritesCount.textContent =
        favorites.length;

}


/* =========================================================
   MOSTRAR FAVORITOS
========================================================= */

favoritesButton.addEventListener(
    "click",
    showFavorites
);


function showFavorites() {

    showingFavorites =
        !showingFavorites;


    if (
        showingFavorites
    ) {

        const favoritePokemon =
            allPokemon.filter(
                pokemon =>
                    favorites.includes(
                        pokemon.id
                    )
            );


        resultsTitle.textContent =
            "❤️ Mis favoritos";


        resultsInfo.textContent =
            `${favoritePokemon.length} Pokémon favoritos`;


        renderPokemon(
            favoritePokemon
        );


        loadMoreButton.classList.add(
            "hidden"
        );


    } else {

        resultsTitle.textContent =
            "Todos los Pokémon";

        loadMoreButton.classList.remove(
            "hidden"
        );

        applyFilters();

    }

}


/* =========================================================
   MODAL
========================================================= */

function openModal(pokemon) {

    currentPokemon =
        pokemon;


    modalPokemonId.textContent =
        `#${formatId(pokemon.id)}`;


    modalPokemonName.textContent =
        capitalize(
            pokemon.name
        );


    modalPokemonImage.src =
        getPokemonImage(
            pokemon
        );


    modalPokemonImage.alt =
        capitalize(
            pokemon.name
        );


    modalTypes.innerHTML =
        createTypesHTML(
            pokemon.types
        );


    modalHeight.textContent =
        `${(
            pokemon.height / 10
        ).toFixed(1)} m`;


    modalWeight.textContent =
        `${(
            pokemon.weight / 10
        ).toFixed(1)} kg`;


    modalExperience.textContent =
        pokemon.base_experience;


    const total =
        pokemon.stats.reduce(
            (
                sum,
                stat
            ) =>
                sum +
                stat.base_stat,
            0
        );


    modalTotalStats.textContent =
        total;


    renderModalStats(
        pokemon.stats
    );


    renderModalAbilities(
        pokemon.abilities
    );


    updateModalFavorite();


    pokemonModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

}


function closePokemonModal() {

    pokemonModal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


closeModal.addEventListener(
    "click",
    closePokemonModal
);


document
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closePokemonModal
    );


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !pokemonModal.classList.contains(
                "hidden"
            )
        ) {

            closePokemonModal();

        }

    }
);


/* =========================================================
   MODAL FAVORITO
========================================================= */

modalFavorite.addEventListener(
    "click",
    () => {

        if (!currentPokemon) {
            return;
        }


        toggleFavorite(
            currentPokemon.id
        );


        updateModalFavorite();

    }
);


function updateModalFavorite() {

    if (!currentPokemon) {
        return;
    }


    modalFavorite.textContent =
        favorites.includes(
            currentPokemon.id
        )
            ? "❤️"
            : "♡";

}


/* =========================================================
   MODAL STATS
========================================================= */

function renderModalStats(stats) {

    modalStats.innerHTML = "";


    stats.forEach(
        stat => {

            const value =
                stat.base_stat;


            const percentage =
                Math.min(
                    value / 255 * 100,
                    100
                );


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "stat-row";


            row.innerHTML = `

                <span class="stat-name">
                    ${translateStat(
                        stat.stat.name
                    )}
                </span>

                <span class="stat-value">
                    ${value}
                </span>

                <div class="stat-bar">

                    <div
                        class="stat-progress"
                        style="
                            width: ${percentage}%;
                        "
                    ></div>

                </div>

            `;


            modalStats.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   MODAL ABILITIES
========================================================= */

function renderModalAbilities(
    abilities
) {

    modalAbilities.innerHTML = "";


    abilities.forEach(
        ability => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "ability";


            if (
                ability.is_hidden
            ) {

                div.classList.add(
                    "hidden-ability"
                );

                div.textContent =
                    `${translateAbility(
                        ability.ability.name
                    )} ★`;

            } else {

                div.textContent =
                    translateAbility(
                        ability.ability.name
                    );

            }


            modalAbilities.appendChild(
                div
            );

        }
    );

}


/* =========================================================
   TEMA
========================================================= */

themeButton.addEventListener(
    "click",
    toggleTheme
);


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "pokemonTheme",
        isDark
            ? "dark"
            : "light"
    );


    themeButton.textContent =
        isDark
            ? "☀️"
            : "🌙";

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "pokemonTheme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

        themeButton.textContent =
            "☀️";

    }

}


/* =========================================================
   HELPERS
========================================================= */

function getPokemonImage(pokemon) {

    return (
        pokemon.sprites
            ?.other
            ?.["official-artwork"]
            ?.front_default
        ||
        pokemon.sprites
            ?.front_default
        ||
        ""
    );

}


function formatId(id) {

    return String(id)
        .padStart(3, "0");

}


function capitalize(text) {

    if (!text) {
        return "";
    }

    return text.charAt(0)
        .toUpperCase()
        +
        text.slice(1);

}


function createTypesHTML(
    types
) {

    return types
        .map(
            item => {

                const type =
                    item.type.name;


                return `

                    <span
                        class="type type-${type}"
                    >
                        ${translateType(
                            type
                        )}
                    </span>

                `;

            }
        )
        .join("");

}


function translateType(type) {

    const types = {

        normal: "Normal",
        fire: "Fuego",
        water: "Agua",
        electric: "Eléctrico",
        grass: "Planta",
        ice: "Hielo",
        fighting: "Lucha",
        poison: "Veneno",
        ground: "Tierra",
        flying: "Volador",
        psychic: "Psíquico",
        bug: "Bicho",
        rock: "Roca",
        ghost: "Fantasma",
        dragon: "Dragón",
        dark: "Siniestro",
        steel: "Acero",
        fairy: "Hada"

    };


    return types[type] || type;

}


function translateStat(stat) {

    const stats = {

        hp: "PS",

        attack:
            "Ataque",

        defense:
            "Defensa",

        "special-attack":
            "At. Especial",

        "special-defense":
            "Def. Especial",

        speed:
            "Velocidad"

    };


    return (
        stats[stat] ||
        stat
    );

}


function translateAbility(
    ability
) {

    const abilities = {

        "limber":
            "Flexibilidad",

        "imposter":
            "Impostor",

        "overgrow":
            "Espesura",

        "blaze":
            "Mar Llamas",

        "torrent":
            "Torrente",

        "shield-dust":
            "Polvo Escudo",

        "compound-eyes":
            "Ojo Compuesto",

        "keen-eye":
            "Vista Lince",

        "intimidate":
            "Intimidación",

        "static":
            "Electricidad Estática",

        "levitate":
            "Levitación",

        "synchronize":
            "Sincronía",

        "pressure":
            "Presión",

        "inner-focus":
            "Foco Interno",

        "insomnia":
            "Insomnio",

        "swift-swim":
            "Nado Rápido",

        "chlorophyll":
            "Clorofila"

    };


    return (
        abilities[ability] ||
        ability.replaceAll(
            "-",
            " "
        )
    );

}


function getStat(
    pokemon,
    statName
) {

    const stat =
        pokemon.stats.find(
            item =>
                item.stat.name ===
                statName
        );


    return stat
        ? stat.base_stat
        : 0;

}


function getTypeColor(
    type
) {

    const colors = {

        normal: "#a8a77a",

        fire: "#ee8130",

        water: "#6390f0",

        electric: "#f7d02c",

        grass: "#7ac74c",

        ice: "#96d9d6",

        fighting: "#c22e28",

        poison: "#a33ea1",

        ground: "#e2bf65",

        flying: "#a98ff3",

        psychic: "#f95587",

        bug: "#a6b91a",

        rock: "#b6a136",

        ghost: "#735797",

        dragon: "#6f35fc",

        dark: "#705746",

        steel: "#b7b7ce",

        fairy: "#d685ad"

    };


    return (
        colors[type] ||
        "#777"
    );

}


/* =========================================================
   RESULTADOS
========================================================= */

function updateResultsInfo() {

    if (
        showingFavorites
    ) {

        return;

    }


    resultsTitle.textContent =
        "Todos los Pokémon";


    resultsInfo.textContent =
        `${displayedPokemon.length} Pokémon cargados`;

}


function showLoading() {

    loading.classList.remove(
        "hidden"
    );

}


function hideLoading() {

    loading.classList.add(
        "hidden"
    );

}


function showError() {

    errorMessage.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

}


retryButton.addEventListener(
    "click",
    () => {

        errorMessage.classList.add(
            "hidden"
        );

        loadPokemon();

    }
);


/* =========================================================
   TOAST
========================================================= */

let toastTimeout;


function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}
