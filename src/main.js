const meals_el = document.querySelector('#meals')
const favContainer = document.getElementById('fav-meals')

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
  const resp = await fetch(
    'https://www.themealdb.com/api/json/v1/1/search.php?s=' + term
  )

  const respData = await resp.json()
  const meals = respData.meals

  return meals
}

function addMeal(mealData, random = false) {
  const meal = document.createElement('div')

  meal.classList.add('meal')

  meal.innerHTML = `<div class="meal">
          <div class="meal-header">
          ${random ? ` <span class="random"> Random Recipe </span>` : ''}
            
            <img
              src="${mealData.strMealThumb}"
              alt="${mealData.strMeal}"
            />
          </div>
          <div class="meal-body">
            <h4>${mealData.strMeal}</h4>
            <button class="fav-btn" id = 'fav-btn'><i class="ph-fill ph-star"></i></button>
          </div>
        </div>`
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

  meal.addEventListener('click', () => {
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
  favContainer.innerHTML = ''
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
  <img
    src="${mealData.strMealThumb}"
    alt="${mealData.strMeal}"
  /><span>${mealData.strMeal}</span>
  <button class = 'clear'><i class="ph-fill ph-x-circle"></i></button>
`
  const btn = favMeal.querySelector('.clear')

  btn.addEventListener('click', () => {
    removeMealLS(mealData.idMeal)
    fetchFavMeals()
  })
  favMeal.addEventListener('click', () => {
    showMealInfo(mealData)
  })
  favContainer.appendChild(favMeal)
}

function showMealInfo(mealData) {
  meal_info_el.innerHTML = ''
  const meal_el = document.createElement('div')
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

close_popup.addEventListener('click', () => {
  meal_info_popup.classList.add('hidden')
})
