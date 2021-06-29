import {select, classNames, templates, settings} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart{
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};
      
    thisCart.dom.wrapper = element;
    thisCart.dom.productList = document.querySelector(select.cart.productList);
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
  }

  initActions(){
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
      thisCart.clearCart();
    });
  }

  add(menuProduct){
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct,generatedDOM));
    thisCart.update();
  }

  update(){
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subTotalPrice = 0;
    thisCart.totalPrice = 0;

    for(let product of thisCart.products){
      thisCart.totalNumber += product.amount;
      thisCart.subTotalPrice += product.price;
    }
    if(thisCart.totalNumber){
      thisCart.totalPrice = thisCart.subTotalPrice + deliveryFee;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    }else{
      thisCart.dom.deliveryFee.innerHTML = 0;
    }

    thisCart.dom.subTotalPrice.innerHTML = thisCart.subTotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;

    for(let total of thisCart.dom.totalPrice){
      total.innerHTML = thisCart.totalPrice;
    }
  }

  remove(removedProduct){
    const thisCart = this;
      
    const productIndex = thisCart.products.indexOf(removedProduct);
    thisCart.products.splice(productIndex, 1);

    removedProduct.dom.wrapper.classList.add('remove');
    thisCart.dom.productList.querySelector('.remove').remove();

    thisCart.update();
  }

  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
      
    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subTotalPrice: thisCart.subTotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: settings.cart.defaultDeliveryFee,
      products: []
    };

    for(let prod of thisCart.products){
      payload.products.push(prod.getData());
    }

    const options = { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload) 
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
      });
  }

  clearCart(){
    const thisCart = this;
    const cartElem = thisCart.dom.productList.querySelectorAll('li');

    thisCart.products = [];

    for(let elem of cartElem){
      elem.remove();
    }

    thisCart.dom.address.value = '';
    thisCart.dom.phone.value = '';

    thisCart.update();
  }
}

export default Cart;