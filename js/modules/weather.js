LDR.WeatherView = Backbone.View.extend({
    className: 'weather',
    template: 'weather',
    getWeatherUrl: function(position){
        return 'http://api.openweathermap.org/data/2.5/weather?units=imperial&lat=' + position.latitude + '&lon=' + position.longitude + '&APPID=' + LDR.WeatherView.openweathermapKey;
    },
    getWeather: function(){
        var deferred = $.Deferred();
        $.getJSON(this.getWeatherUrl(this.position), function(weather){
            deferred.resolve(weather);
        });
        return deferred;
    },
    initialize: function(options){
        var that = this;
        this.position = options.position;
        this.uid = options.uid;
        var weatherPromise = LDR.Cache.get('weather'+this.uid, LDR.WeatherView.cacheMinutes, this.getWeather.bind(this));
        $.when(weatherPromise).done(function(weather){
            that.weather = weather;
            that.render();
        });
    },
    serializeData: function(){
        return {
            weather_icon: LDR.WeatherView.weatherToIconMap[this.weather.weather[0].icon],
            weather_description: this.weather.weather[0].description,
            temperature: this.weather.main.temp,
            latitude: this.position.latitude.toFixed(3),
            longitude: this.position.longitude.toFixed(3)
        };
    },
    render: function(){
        this.$el.html(render_template(this.template, this.serializeData()));
        return this;
    }
},{
    openweathermapKey: '3721e68109d53ebd6aef569e223b0ec4',
    weatherToIconMap: {
        '01d': 'sun',
        '02d': 'cloud sun',
        '03d': 'cloud',
        '04d': 'cloud',
        '09d': 'showers',
        '10d': 'rain sun',
        '11d': 'lightning',
        '13d': 'snow',
        '50d': 'fog',
        '01n': 'moon',
        '02n': 'cloud moon',
        '03n': 'cloud moon',
        '04n': 'cloud moon',
        '09n': 'showers moon',
        '10n': 'rain moon',
        '11n': 'lightning moon',
        '13n': 'snow moon',
        '50n': 'fog moon'
    },
    cacheMinutes: 60 // how long to cache the data for
});