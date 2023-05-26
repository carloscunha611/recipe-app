const mobile_container = document.querySelector('#mobile-container')
const meals_el = document.querySelector('#meals')
const fav_meals = document.querySelector('#fav-meals')

const search_temr = document.querySelector('#search-temr')
const search_btn = document.querySelector('#search')

const meal_info_popup = document.querySelector('#meal-info-popup')
const meal_info_el = document.querySelector('#meal-info')
const close_popup = document.querySelector('#close-popup')

getRandomMeal()
fetchFavMeals()

async function getRandomMeal() {
  try {
    const resp = await fetch(
      'https://www.themealdb.com/api/json/v1/1/random.php'
    )
    const respData = await resp.json()
    const randomMeal = respData.meals[0]

    addMeal(randomMeal, true)
  } catch (error) {
    console.log('Erro: ', error)
  }
}

async function getMealById(id) {
  try {
    const resp = await fetch(
      'https://www.themealdb.com/api/json/v1/1/lookup.php?i=' + id
    )
    const respData = await resp.json()
    const meal = respData.meals[0]
    return meal
  } catch (error) {
    console.log('Erro: ', error)
  }
}
async function getMealBySearch(term) {
  try {
    const resp = await fetch(
      'https://www.themealdb.com/api/json/v1/1/search.php?s=' + term
    )
    const respData = await resp.json()
    const meals = respData.meals
    return meals
  } catch (error) {
    console.log('Erro: ', error)
  }
}

function addMeal(mealData, random = false) {
  const meal = document.createElement('li')

  meal.classList.add('meal-container')

  const build = `
  <div class="meal">
    <div class="meal-header">
       <span class="random"> ${mealData.strCategory} </span>        
        <img loading='lazy' class = 'meal-img'
          src="${mealData.strMealThumb}"
          alt="${mealData.strMeal}"
        />
      </div>
    <div class="meal-body">
      <h4>${mealData.strMeal}</h4>
      <button class="fav-btn" id = 'fav-btn'><i class="ph-fill ph-star"></i></button>
      </div>
    </div>
      `

  meal.innerHTML = build

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

async function fetchFavMeals() {
  fav_meals.innerHTML = ''
  const mealIds = getMealsLS()
  const meals = []
  for (let i = 0; i < mealIds.length; i++) {
    const mealId = mealIds[i]

    meal = await getMealById(mealId)
    addMealToFav(meal)
  }
}

function addMealToFav(mealData) {
  const favMeal = document.createElement('li')
  favMeal.innerHTML = `
  <img loading = 'lazy'
    src="${mealData.strMealThumb}"
    alt="${mealData.strMeal}"
  /><span>${mealData.strMeal}</span>
  <button class = 'clear'><i class="ph-fill ph-x-circle"></i></button>
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
  meal_el.classList.add('mael-el')
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
}

search_btn.addEventListener('click', async () => {
  meals_el.innerHTML = ''
  const search = search_temr.value

  const meals = await getMealBySearch(search)

  if (meals) {
    meals.forEach(meal => {
      addMeal(meal)
    })
  }
})

search_temr.addEventListener('keypress', async event => {
  const keyCode = event.keyCode || event.which
  const meal = document.createElement('li')
  meal.classList.add('alert')

  const build = `<span class="not-found"> "${search_temr.value}" not found </span>`

  if (keyCode === 13) {
    meals_el.innerHTML = ''
    const search = search_temr.value

    const meals = await getMealBySearch(search)
    if (meals) {
      meals.forEach(meal => {
        addMeal(meal)
      })
    } else {
      meal.innerHTML = build
      meals_el.appendChild(meal)
    }
  }
})

close_popup.addEventListener('click', () => {
  meal_info_popup.classList.add('hidden')
})
