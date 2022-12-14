var displayError = document.getElementById('card-errors');
function errorHandler(err) {
  changeLoadingState(false);
  displayError.textContent = err;
}
var orderData = {
  items: [{ id: "yelpcamp-registration-fee" }],
  currency: "usd"
};

var stripe = Stripe('pk_test_51H1m6CBVqxDuAQt21uh6GYjVie6k9K7K2aKQ1vPR6FUSqqGDuDXAuu7SWN4OQZC0n0Pe2WJoONzVtc3bLl26XxTi002tHE8X5O');
var elements = stripe.elements();

var style = {
  base: {
    color: "#32325d",
  }
};

var card = elements.create("card", { style: style });
card.mount("#card-element");

card.addEventListener('change', function(event) {
  if (event.error) {
    errorHandler(event.error.message);
  } else {
    errorHandler('');
  }
});

var form = document.getElementById('payment-form');

form.addEventListener('submit', function(ev) {
  ev.preventDefault();

  changeLoadingState(true);
  
  stripe.createPaymentMethod("card", card)
        .then(function(result) {
          if (result.error) {
            errorHandler(result.error.message);
          } else {
            orderData.paymentMethodId = result.paymentMethod.id;

            return fetch("/pay", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(orderData)
            });
          }
        })
        .then(function(result) {
          return result.json();
        })
        .then(function(response) {
          if (response.error) {
            errorHandler(response.error);
          } else {
            changeLoadingState(false);
            window.location.href = '/campgrounds?paid=true'
          }
        }).catch(function(err) {
          errorHandler(err.error);
        });
});

// Show a spinner on payment submission
function changeLoadingState(isLoading) {
    if (isLoading) {
        document.querySelector("button").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("button").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
};