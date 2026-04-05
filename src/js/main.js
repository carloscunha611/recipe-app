const checkbox = document.querySelector('.checkbox')
const logo = document.querySelector('.logo')
const meals_el = document.querySelector('#meals')
const fav_meals = document.querySelector('#fav-meals')
const fav_count = document.querySelector('#fav-count')

const search_term = document.querySelector('#search-term')
const search_btn = document.querySelector('#search')
const clear_search_btn = document.querySelector('#clear-search')
const quick_chips = document.querySelectorAll('.quick-chip')
const recent_searches_list = document.querySelector('#recent-searches-list')

const meal_info_popup = document.querySelector('#meal-info-popup')
const meal_info_el = document.querySelector('#meal-info')
const close_popup = document.querySelector('#close-popup')
const share_meal_btn = document.querySelector('#share-meal')

const RANDOM_MEALS_COUNT = 6

let lastFocusedElement = null
let currentMealForShare = null
let undoTimerId = null
let lastRemovedFavorite = null

if (logo) {
  logo.addEventListener('click', () => {
    window.location.reload()
  })
}

if (checkbox) {
  checkbox.addEventListener('click', () => {
    document.body.classList.toggle('light')
  })
}

renderRecentSearches()
loadRandomMeals(RANDOM_MEALS_COUNT)
fetchFavMeals()

async function loadRandomMeals(count = 1) {
  meals_el.innerHTML = ''

  for (let i = 0; i < count; i++) {
    await getRandomMeal()
  }
}

async function getRandomMeal() {
  try {
    const resp = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
    const respData = await resp.json()
    const randomMeal = respData?.meals?.[0]

    if (randomMeal) {
      addMeal(randomMeal)
    } else {
      showMealsStatus('Não foi possível carregar uma receita aleatória.', 'error')
    }
  } catch (error) {
    console.error(
      `An error occurred while trying to generate random meal: ${error}`
    )
    showMealsStatus('Falha de conexão ao carregar receita aleatória.', 'error')
  }
}

async function getMealById(id) {
  try {
    const resp = await fetch(
      'https://www.themealdb.com/api/json/v1/1/lookup.php?i=' + id
    )
    const respData = await resp.json()
    const meal = respData?.meals?.[0] || null
    return meal
  } catch (error) {
    console.error(`An error occurred while trying to generate the id: ${error}`)
    return null
  }
}

async function getMealBySearch(term) {
  try {
    const resp = await fetch(
      'https://www.themealdb.com/api/json/v1/1/search.php?s=' + term
    )
    const respData = await resp.json()
    const meals = respData?.meals || null
    return meals
  } catch (error) {
    console.error(`An error occurred while trying to search: ${error}`)
    return null
  }
}

function addMeal(mealData) {
  const meal = document.createElement('li')
  meal.classList.add('meal-container')

  const isFavorite = getMealsLS().includes(mealData.idMeal)

  meal.innerHTML = `
  <div class="meal">
    <div class="meal-header">
       <span class="random"> ${mealData.strCategory} </span>
        <img loading='lazy' class='meal-img'
          src="${mealData.strMealThumb}"
          alt="${mealData.strMeal}"
        />
      </div>
    <div class="meal-body">
      <h4>${mealData.strMeal}</h4>
      <button class="fav-btn ${isFavorite ? 'active' : ''}" aria-label="Adicionar ou remover dos favoritos"><i class="ph-fill ph-star"></i></button>
      </div>
    </div>
      `

  const btn = meal.querySelector('.fav-btn')
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) {
      removeMealLS(mealData.idMeal)
      btn.classList.remove('active')
    } else {
      addMealLS(mealData.idMeal)
      btn.classList.add('active')
    }

    fetchFavMeals()
  })

  const img = meal.querySelector('.meal-header')
  img.addEventListener('click', () => {
    showMealInfo(mealData)
  })

  meals_el.appendChild(meal)
}

function addMealLS(mealId) {
  const mealIds = getMealsLS()

  if (mealIds.includes(mealId)) {
    return
  }

  localStorage.setItem('mealIds', JSON.stringify([...mealIds, mealId]))
}

function removeMealLS(mealId) {
  const mealIds = getMealsLS()

  localStorage.setItem(
    'mealIds',
    JSON.stringify(mealIds.filter(id => id !== mealId))
  )
}

function getMealsLS() {
  const mealIds = JSON.parse(localStorage.getItem('mealIds'))

  return mealIds === null ? [] : mealIds
}

function showMealsStatus(message, type = 'info') {
  meals_el.innerHTML = ''
  const meal = document.createElement('li')
  meal.classList.add('alert')
  meal.innerHTML = `<span class="status-message ${type}">${message}</span>`
  meals_el.appendChild(meal)
}

function showFavStatus(message) {
  fav_meals.innerHTML = `<li class="fav-status">${message}</li>`
}

function updateFavCount() {
  fav_count.textContent = `(${getMealsLS().length})`
}

function showUndoToast(mealId) {
  lastRemovedFavorite = mealId

  if (undoTimerId) {
    window.clearTimeout(undoTimerId)
  }

  const existingToast = document.querySelector('.undo-toast')
  if (existingToast) {
    existingToast.remove()
  }

  const toast = document.createElement('div')
  toast.classList.add('undo-toast')
  toast.innerHTML = `Receita removida dos favoritos. <button class="undo-btn">Desfazer</button>`

  toast.querySelector('.undo-btn').addEventListener('click', () => {
    if (lastRemovedFavorite) {
      addMealLS(lastRemovedFavorite)
      fetchFavMeals()
      lastRemovedFavorite = null
    }
    toast.remove()
  })

  document.body.appendChild(toast)

  undoTimerId = window.setTimeout(() => {
    toast.remove()
    lastRemovedFavorite = null
  }, 3000)
}

async function fetchFavMeals() {
  showFavStatus('Carregando favoritos...')

  const mealIds = getMealsLS()
  updateFavCount()

  if (!mealIds.length) {
    showFavStatus('Você ainda não tem receitas favoritas.')
    return
  }

  fav_meals.innerHTML = ''

  for (let i = 0; i < mealIds.length; i++) {
    const mealId = mealIds[i]
    const meal = await getMealById(mealId)

    if (meal) {
      addMealToFav(meal)
    }
  }

  if (!fav_meals.children.length) {
    showFavStatus('Não foi possível carregar os favoritos.')
  }
}

function addMealToFav(mealData) {
  const favMeal = document.createElement('li')
  favMeal.innerHTML = `
  <img loading='lazy'
    src="${mealData.strMealThumb}"
    alt="${mealData.strMeal}"
  /><span>${mealData.strMeal}</span>
  <button class='clear' aria-label='Remover dos favoritos'><i class="ph-fill ph-x-circle"></i></button>
`

  const btn = favMeal.querySelector('.clear')
  const img = favMeal.querySelector('img')

  btn.addEventListener('click', () => {
    removeMealLS(mealData.idMeal)
    showUndoToast(mealData.idMeal)
    fetchFavMeals()
  })

  img.addEventListener('click', () => {
    showMealInfo(mealData)
  })

  fav_meals.appendChild(favMeal)
}

function showMealInfo(mealData) {
  meal_info_el.innerHTML = ''

  const meal_el = document.createElement('div')
  meal_el.classList.add('meal-el')
  const ingredients = []

  for (let i = 1; i < 20; i++) {
    if (mealData['strIngredient' + i]) {
      ingredients.push(
        `${mealData['strIngredient' + i]} - ${mealData['strMeasure' + i]}`
      )
    } else break
  }

  meal_el.innerHTML = `
    <h1 id="meal-title">${mealData.strMeal}</h1>
    <img
      src="${mealData.strMealThumb}"
      alt="${mealData.strMeal}"
    />

    <p>
      ${mealData.strInstructions}
    </p>
    <h3>Ingredients:</h3>
    <ul>
      ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
    </ul>
  `

  meal_info_el.appendChild(meal_el)
  meal_info_popup.classList.remove('hidden')

  currentMealForShare = mealData
  lastFocusedElement = document.activeElement
  close_popup.focus()
}

function saveRecentSearch(term) {
  const recentTerms = JSON.parse(localStorage.getItem('recentSearches')) || []
  const updatedTerms = [term, ...recentTerms.filter(item => item !== term)].slice(
    0,
    5
  )

  localStorage.setItem('recentSearches', JSON.stringify(updatedTerms))
}

function renderRecentSearches() {
  if (!recent_searches_list) {
    return
  }

  const recentTerms = JSON.parse(localStorage.getItem('recentSearches')) || []
  recent_searches_list.innerHTML = ''

  if (!recentTerms.length) {
    recent_searches_list.innerHTML = '<li class="recent-empty">Nenhuma busca recente.</li>'
    return
  }

  recentTerms.forEach(term => {
    const li = document.createElement('li')
    li.innerHTML = `<button class="recent-btn" data-term="${term}">${term}</button>`
    recent_searches_list.appendChild(li)
  })
}

async function handleSearch(forcedTerm = '') {
  const search = (forcedTerm || search_term.value).trim().toLowerCase()

  if (!search) {
    loadRandomMeals(RANDOM_MEALS_COUNT)
    return
  }

  showMealsStatus('Buscando receitas...', 'info')

  const meals = await getMealBySearch(search)

  if (meals && meals.length) {
    meals_el.innerHTML = ''
    meals.forEach(meal => {
      addMeal(meal)
    })
    saveRecentSearch(search)
    renderRecentSearches()
  } else {
    showMealsStatus(`"${search}" não encontrado.`, 'error')
  }
}

if (search_btn) {
  search_btn.addEventListener('click', () => handleSearch())
}

if (clear_search_btn) {
  clear_search_btn.addEventListener('click', () => {
    search_term.value = ''
    search_term.focus()
    loadRandomMeals(RANDOM_MEALS_COUNT)
  })
}

if (search_term) {
  search_term.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  })
}

if (quick_chips?.length) {
  quick_chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const term = chip.dataset.term
      search_term.value = term
      handleSearch(term)
    })
  })
}

if (recent_searches_list) {
  recent_searches_list.addEventListener('click', event => {
    const button = event.target.closest('.recent-btn')
    if (!button) {
      return
    }

    const { term } = button.dataset
    search_term.value = term
    handleSearch(term)
  })
}

function hideMealInfo() {
  meal_info_popup.classList.add('hidden')

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus()
  }
}

async function shareCurrentMeal() {
  if (!currentMealForShare) {
    return
  }

  const shareData = {
    title: currentMealForShare.strMeal,
    text: `Veja esta receita: ${currentMealForShare.strMeal}`,
    url: currentMealForShare.strSource || currentMealForShare.strYoutube || window.location.href,
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
      return
    }

    await navigator.clipboard.writeText(shareData.url)
    showMealsStatus('Link da receita copiado para a área de transferência.', 'info')
  } catch (error) {
    console.error(`An error occurred while trying to share meal: ${error}`)
  }
}

if (share_meal_btn) {
  share_meal_btn.addEventListener('click', shareCurrentMeal)
}

if (close_popup) {
  close_popup.addEventListener('click', hideMealInfo)
}

meal_info_popup.addEventListener('click', event => {
  if (event.target === meal_info_popup) {
    hideMealInfo()
  }
})

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !meal_info_popup.classList.contains('hidden')) {
    hideMealInfo()
  }
})
