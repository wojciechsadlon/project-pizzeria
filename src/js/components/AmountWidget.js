import {settings, select} from '../settings.js';

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

export default AmountWidget;