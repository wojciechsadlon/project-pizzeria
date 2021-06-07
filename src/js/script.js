/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      thisWidget.value = settings.amountWidget.defaultValue;
      
      thisWidget.getElements(element);
      thisWidget.initActions();
      thisWidget.setValue(thisWidget.input.value);
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(--thisWidget.input.value);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(++thisWidget.input.value);
      });
    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);

      if(newValue !== thisWidget.value && !isNaN(newValue) 
      && newValue >= settings.amountWidget.defaultMin 
      && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }

    announce(){
      const thisWidget = this;

      const event = new Event ('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

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

  class CartProduct{
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.params = menuProduct.params;
      
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    getData(){
      const thisCartProduct = this;

      const payload = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: thisCartProduct.params,
      };
      console.log(payload);
      return payload;
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.price = thisCartProduct.amountWidget.value * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        }
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
  } 

  const app = {
    initMenu: function(){
      const thisApp = this;
      
      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function(){
      const thisApp = this;
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        });

      thisApp.data = {};
    },
    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },
  };

  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id,
      thisProduct.data = data,

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu(){
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);

      thisProduct.element = utils.createDOMFromHTML(generatedHTML);

      const menuContainer = document.querySelector(select.containerOf.menu);

      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
      const productForm = thisProduct.element.querySelector(select.menuProduct.form);
    
      thisProduct.dom = {
        imageWrapper: thisProduct.element.querySelector(select.menuProduct.imageWrapper),
        accordionTrigger: thisProduct.element.querySelector(select.menuProduct.clickable),
        form: productForm,
        formInputs: productForm.querySelectorAll(select.all.formInputs),
        cartButton: thisProduct.element.querySelector(select.menuProduct.cartButton),
        priceElem: thisProduct.element.querySelector(select.menuProduct.priceElem),
        amountWidgetElem: thisProduct.element.querySelector(select.menuProduct.amountWidget)
      };
    }

    initAccordion(){
      const thisProduct = this;

      thisProduct.dom.accordionTrigger.addEventListener('click', function(event){
        event.preventDefault();
        const activeProduct = document.querySelector('.product.active');

        if(activeProduct && activeProduct != thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }

        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm(){
      const thisProduct = this;

      thisProduct.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      
      for(let input of thisProduct.dom.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      
      thisProduct.dom.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
        thisProduct.resetProduct();
      });
    }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){thisProduct.processOrder();});
    }

    processOrder(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      let price = thisProduct.data.price;
    
      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for(let optionId in param.options) {
          const option = param.options[optionId];
          const activeImg = thisProduct.dom.imageWrapper.querySelector('[class~="' + paramId + '-' + optionId + '"]');
          const isOptionChosen = formData[paramId].includes(optionId);

          if(activeImg){
            if(isOptionChosen){
              activeImg.classList.add(classNames.menuProduct.wrapperActive);
            }else{
              activeImg.classList.remove(classNames.menuProduct.wrapperActive);
            }
          }

          if(isOptionChosen && !option.default){
            price += option.price;
          } else if(!isOptionChosen && option.default){
            price -= option.price;
          }
        }
      }
      
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.dom.priceElem.innerHTML = price;
    }

    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      const params = {};

      for(let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {}
        };

        for(let optionId in param.options) {
          const option = param.options[optionId];
          const isOptionChosen = formData[paramId].includes(optionId);

          if(isOptionChosen){
            params[paramId].options[optionId] = option.label;
          }
        }
      }

      return params;
    }
    

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams(),
      };

      return productSummary;
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());
    }

    resetProduct(){
      const thisProduct = this;
      const forms = thisProduct.dom.formInputs;

      console.log(forms);
      for(let form of forms){

        if(form.className === 'amount'){
          form.value = 1;
        }else if(form.defaultChecked){
          form.checked = true;
        }else if(!form.defaultChecked){
          form.checked = false;
        }
        // jesli polacze dolnego ifa jako else if z gornym to skrypt nie zadziala (?)
        if(form.length){
          for(let option of form){
            if(!option.defaultSelected){
              option.selected = false;
            }else if(option.defaultSelected){
              option.selected = true;
            }
          }
        }
      }

      thisProduct.processOrder();
      // po resecie opcji ta funkcja może jest pewnym obejsciem resetowania ustawien obrazka ale skoro mamy domyslne ustawienia produktu to nic nie psuje ;)
    }
  }

  app.init();
}
