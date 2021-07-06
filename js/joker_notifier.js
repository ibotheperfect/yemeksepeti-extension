// (c) 2015-2016 Farhad Safarov <http://farhadsafarov.com>

var jokerNotifier = {

  _homepage: 'https://www.yemeksepeti.com',
  _jokerUrl: 'https://gate.yemeksepeti.com/joker/api/v1/Joker/new-offer',
  _showNotification: false,

  checkJoker: function(showNotification) {
    var _this = this;
    _this._showNotification = showNotification;
    chrome.storage.local.get('check', function(data) {
      if (data.check) {
        _this._check();
      }
      else {
        $('.result').hide();
        $('.duration-holder').hide();
      }
    });
  },

  _check: function() {
    var _this = this,
      ysData = {

        //'LanguageId': 'tr-TR'
      };
    var ysHeader = {
      'Content-Type': 'application/json;charset=UTF-8',
      //  'X-Requested-With': 'XMLHttpRequest'
      'ys-culture': 'tr-TR'
    }


    chrome.cookies.getAll({}, function(data) {
      $.each(data, function(index, cookie){
        switch(cookie.name) {
          case 'catalogName':
            ysHeader['ys-catalog'] = cookie.value;
            break;
      //    case 'loginToken':
        //    ysRequest['Token'] = cookie.value;
         //   break;
          case 'selectedAreaId':
            ysData['areaid'] = cookie.value;
            break;
          case 'oauth_access_token':
            ysHeader['authorization'] = "Bearer " + cookie.value;
            break;
        }
      });

      _this._fetchResult(ysData, ysHeader);
    });
  },

  _fetchResult: function(ysData, ysHeader) {
    var _this = this;
    $.get( _this._homepage);
    $.ajax({
      url: _this._jokerUrl,
      type: 'get',
      data: ysData,
      headers: ysHeader,
      dataType: 'json',
      complete: function (data) {
        if(_this._showNotification) {
          _this.showNotification(data);
        } else {
          _this._showNotification = true;
        }
        _this.displayResult(data);
      }
    });
  },

  displayResult: function(data_) {
    var resultArea = $('.result');
    resultArea.html('');
    console.log(data_);

    if(data_.status != 200){
      resultArea.html('Yemeksepetine bağlanılamadı.<br><a href="'+ this._homepage +'" target="_blank">Giriş</a> yaptığınızdan emin olunuz.');
      chrome.browserAction.setBadgeText ( { text: '' } );
      return;
    }
    var data = data_.responseJSON.Data;
    if (data.OfferItems && data.OfferItems.length) {
      if (typeof(startTimer) === typeof(Function)) {
        startTimer(data.RemainingDuration/1000, $('#duration'));
      }

      var table = $('<table/>');

      $.each(data.OfferItems, function(index, offer) {
        var row = $('<tr/>', {
          'data-href': 'https://www.yemeksepeti.com' + offer.Restaurant.RestaurantSeoUrl
        });

        row.append($('<td/>').html($('<img />', {
          src: offer.Restaurant.JokerImageUrl,
          alt: offer.Restaurant.DisplayName,
          width: 60
        })));
        row.append($('<td/>').text(offer.Restaurant.DisplayName));
        row.append($('<td/>', {'class': 'strong'}).html(offer.Restaurant.AveragePoint));
        table.append(row);
      });

      resultArea.append(table);

      chrome.browserAction.setBadgeText ( { text: data.OfferItems.length.toString() } );
    }
    else {
      // resultArea.html(data.IsValid ? 'Joker yok :(' : data.Message);
      resultArea.html('Joker yok :(');
      chrome.browserAction.setBadgeText ( { text: '' } );
    }
  },

  // Aynı notification tekrar çıkmasın diye son 8 jokeri tutuyor
  history: Array(8).fill(''),

  showNotification: function(data_) {
    var data = data_.responseJSON.Data;
    var _this = this;
    $.each(data.OfferItems, function(index, offer) {
      if(_this.history.indexOf(offer.Restaurant.DisplayName) == -1) {
        var options = {
          type: 'basic',
          title: 'Joker İndirimi!',
          message: offer.Restaurant.DisplayName + '('+ offer.Restaurant.AveragePoint +')',
          iconUrl: offer.Restaurant.JokerImageUrl
        }

        _this.history.shift();
        _this.history.push(offer.Restaurant.DisplayName);
        chrome.notifications.create(options);
      }
    });
  }
};
