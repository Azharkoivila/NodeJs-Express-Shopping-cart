
history.pushState(null, "", location.href.split("?")[0]);
//jquary image Validation
$(document).ready(function () {
  $("#productImage").on("change", function () {
    let files = $(this)[0].files;
    $("#preview-container").empty();
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        let reader = new FileReader();
        reader.onload = function (e) {
          $(
            "<div class='preview'><img src='" +
              e.target.result +
              "'><button class='delete'>Delete</button></div>"
          ).appendTo("#preview-container");
        };
        reader.readAsDataURL(files[i]);
      }
    }
  });
  $("#preview-container").on("click", ".delete", function () {
    $(this).parent(".preview").remove();
    $("#file-input").val("");
  });
});

//splide mounter
let elms = document.getElementsByClassName("splide");

for (let i = 0; i < elms.length; i++) {
  new Splide(elms[i], {
    type: "loop",
    autoplay: "true",
    perPage: 1,
    interval: 2000,
    speed: 1500,
  }).mount();
}

$(document).ready(function () {
  $("#myModal").modal("show");
  // setTimeout(function () {
  //   $("#myModal").modal("hide");
  // }, 1000);
});


function addToCart(val){
$.ajax({
  method: "get",
  url: `/addToCart/${val}`,
  async: true,
  dataType: "json",
  success: function (response) {
    console.log(response)
    if (response.status) {
    let count= $("#cartCount").text();
    count=parseInt(count)+1
    $("#cartCount").html(count);
    } else {
      window.location.href = "/login";
    }
  },
});
}




function changeCount(ProductId, action) {
  $.ajax({
    method: "get",
    url: `/updateCount/?ProductId=${ProductId}&Action=${action}`,
    async: true,
    dataType: "json",
    success: function (response) {
      if(response.status){
          if (action == "inc") {
            let count = $(`#${ProductId}`).val();
            count = parseInt(count) + 1;
            $(`#${ProductId}`).val(count);
             $("#total").html(response.grandTotal);
          } else {
             $("#total").html(response.grandTotal);
            let count = $(`#${ProductId}`).val();
            if (count > 1) {
              count = parseInt(count) - 1;
              $(`#${ProductId}`).val(count);
            }
          }
      }else{
        window.location.href = "/login";
      }
    
      
    },
  });
}