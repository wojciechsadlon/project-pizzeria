import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

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

    // app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct()
      }
    });

    thisProduct.element.dispatchEvent(event);
  }

  resetProduct(){
    const thisProduct = this;
    const forms = thisProduct.dom.formInputs;

    for(let form of forms){

      if(form.className === 'amount'){
        form.value = 1;
      }else if(form.defaultChecked){
        form.checked = true;
      }else if(!form.defaultChecked){
        form.checked = false;
      }
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
    thisProduct.dom.priceElem.innerHTML = thisProduct.data.price;
  }
}

export default Product;