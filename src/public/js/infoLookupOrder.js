//load facebook SDK
(function (d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "//connect.facebook.net/en_US/messenger.Extensions.js";
  fjs.parentNode.insertBefore(js, fjs);
})(document, "script", "Messenger");

//wait to load fb SDK
window.extAsyncInit = function () {
  // the Messenger Extensions JS SDK is done loading
  MessengerExtensions.getContext(
    facebookAppId,
    function success(thread_context) {
      // success
      //set psid to hidden input field
      $("#psid").val(thread_context.psid);
      handleClickBtnFindOrder();
    },
    function error(err) {
      // error
      console.log("==error in sdk load", err);
    }
  );
};

console.log("==facebookAppId==", facebookAppId);

//validate input fields
function validateInputFields() {
  const EMAIL_REG =
    /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  let customerName = $("#customerName");
  let email = $("#email");
  let orderNumber = $("#orderNumber");

  //check customerName
  if (customerName.val() === "") {
    customerName.addClass("is-invalid");
    return true;
  } else {
    customerName.removeClass("is-invalid");
  }

  //check email
  if (!email.val().match(EMAIL_REG)) {
    email.addClass("is-invalid");
    return true;
  } else {
    email.removeClass("is-invalid");
  }

  //check orderNumber
  if (orderNumber.val() === "") {
    orderNumber.addClass("is-invalid");
    return true;
  } else {
    orderNumber.removeClass("is-invalid");
  }

  return false;
}

//handle click on button find order
function handleClickBtnFindOrder() {
  $("#btnFindOrder").on("click", function (e) {
    let check = validateInputFields();

    let data = {
      psid: $("#psid").val(),
      customerName: $("#customerName").val(),
      email: $("#email").val(),
      orderNumber: $("#orderNumber").val(),
    };

    if (!check) {
      //close web-view
      MessengerExtensions.requestCloseBrowser(
        function success() {
          // webview closed
        },
        function error(err) {
          // an error occurred
          console.log("==error in closing web-view", err);
        }
      );

      //send data to node.js server
      $.ajax({
        url: `${window.location.origin}/set-info-lookup-order`,
        method: "POST",
        data: data,
        success: function (data) {
          console.log("==data==", data);
        },
        error: function (error) {
          console.log("==error==", error);
        },
      });
    }
  });
}
