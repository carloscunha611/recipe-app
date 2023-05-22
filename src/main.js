const meals = document.querySelector('#meals')
const favContainer = document.getElementById('fav-meals')
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
  const meals = await fetch(
    'https://www.themealdb.com/api/json/v1/1/search.php?s=' + term
  )
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
  meals.appendChild(meal)
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
  favContainer.appendChild(favMeal)
}
