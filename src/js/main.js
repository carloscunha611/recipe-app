const checkbox = document.querySelector('.checkbox')
const logo = document.querySelector('.logo')
const meals_el = document.querySelector('#meals')
const fav_meals = document.querySelector('#fav-meals')

const search_term = document.querySelector('#search-term')
const search_btn = document.querySelector('#search')

const meal_info_popup = document.querySelector('#meal-info-popup')
const meal_info_el = document.querySelector('#meal-info')
const close_popup = document.querySelector('#close-popup')

let lastFocusedElement = null

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

getRandomMeal()
fetchFavMeals()

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

async function fetchFavMeals() {
  showFavStatus('Carregando favoritos...')

  const mealIds = getMealsLS()

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
    <h1>${mealData.strMeal}</h1>
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

  lastFocusedElement = document.activeElement
  close_popup.focus()
}

async function handleSearch() {
  const search = search_term.value.trim()

  if (!search) {
    meals_el.innerHTML = ''
    getRandomMeal()
    return
  }

  showMealsStatus('Buscando receitas...', 'info')

  const meals = await getMealBySearch(search)

  if (meals && meals.length) {
    meals_el.innerHTML = ''
    meals.forEach(meal => {
      addMeal(meal)
    })
  } else {
    showMealsStatus(`"${search}" não encontrado.`, 'error')
  }
}

if (search_btn) {
  search_btn.addEventListener('click', handleSearch)
}

if (search_term) {
  search_term.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  })
}

function hideMealInfo() {
  meal_info_popup.classList.add('hidden')

  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus()
  }
}

close_popup.addEventListener('click', hideMealInfo)

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
