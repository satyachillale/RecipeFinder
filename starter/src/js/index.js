import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader, elementStrings } from './views/base';
const state = {};

const controlSearch = async () =>{
    const query = searchView.getInput();
    if(query){
        state.search = new Search(query);
        recipeView.clearRecipe();
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchRes);
        await state.search.getResults();
        clearLoader();
        searchView.renderResults(state.search.result);
    }
};

const controlRecipe = async () =>{
    const id = window.location.hash.replace('#','');
    if(id){
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        //searchView.highlightSelected(id);
        state.recipe = new Recipe(id);
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        state.recipe.calcTime();
        state.recipe.calcServings();
        clearLoader();
        recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    }
};

const controlList = () =>{
    if(!state.list) 
        state.list = new List();
    state.recipe.ingredients.forEach(el =>{
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}

const controlLikes = () => {
    if(!state.likes){
        state.likes = new Likes();
    }
    const curId = state.recipe.id;
    if(!state.likes.isLiked(curId)){
        const newLike = state.likes.addLike(curId, state.recipe.title, state.recipe.author, state.recipe.img);
        likesView.toggleLikeButton(true);
        likesView.renderLike(newLike);
    }else{
        state.likes.deleteLike(curId);
        likesView.toggleLikeButton(false);
        likesView.deleteLike(curId);
    }
    likesView.toggleLikesMenu(state.likes.getNumLikes());
}

elements.searchForm.addEventListener('submit', e =>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e=>{
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const gotoPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResult();
        searchView.renderResults(state.search.result, gotoPage);
    }
});

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

window.addEventListener('load', ()=>{
    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikesMenu(state.likes.getNumLikes());
    state.likes.likes.forEach(like => likesView.renderLike(like))
})
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *' )){
        if(state.recipe.servings > 1)
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
    }
    else if(e.target.matches('.btn-increase, .btn-increase *' )){
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        controlLikes();
    }
});

elements.shopping.addEventListener('click', e =>{
    const id = e.target.closest('.shopping__item').dataset.itemid;
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        state.list.deleteItem(id);
        listView.deleteItem(id);
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value);
        state.list.update(id, val);
    }
})