const golos = require('golos-js')
var fs = require("fs");
golos.config.set('websocket','wss://ws.golos.io');
golos.config.set('address_prefix','GLS');
golos.config.set('chain_id','782a3039b478c839e4cb0c941ff4eaeb7df40bdd68bd441afd444b9da763de12');

//----Блок настроек-----
var account='ваш аккаунт без @';
var wif ='ваш приватный постинг ключ'; 
var link='ваш url поста под которым размещать комментарии';
var interlived=21;//время в секундах между комментариями
var votepower=95;//значение Voting Power (заряда батарейки) при котором робот деактивируется
var up=true;//false - постинг без апвоутов, true - постинг с апвоутом
var lexicon=true;//false - комментарий по умолчанию, true - использовать подключаемый файл lexicon.txt
//----------------------

var contents = fs.readFileSync('./lexicon.txt', 'utf8');
var comma='||';//разделитель в между контентом комментариев в подключаемом файле lexicon.txt
var word=contents.split(comma);
var max=word.length;
var min=1;

var timerId = setInterval(function() {
	if(up===true)vp(); else posting();
}, +interlived*1000);

function posting(){
var dt_now = Math.round(Date.now()/1000);
var parent_author=link.split('@')[1].split('/')[0]; 
var parent_permlink=link.split('@')[1].split('/')[1];
var author=account; 
var permlink='re-'+parent_author+'-'+parent_permlink+dt_now;
var post_body;
if(lexicon===true)post_body=message();//текст комментария из подключаемого файла
else post_body='miner';//'Ваш текст комментария' или оставьте как есть (текст по умолчанию)
var title ='';
var jsonMetadata = {};
var percent=10000;	//вес апвоута (10000 = 100%)
golos.broadcast.comment(wif,parent_author,parent_permlink,author,permlink,title,post_body,jsonMetadata,function(err, result) {
if(err){console.log(err); } else {
console.log('Последний комментарий опубликован: '+new Date());
if(up===true){
golos.broadcast.vote(wif, account, author, permlink, percent, function(err, result) {
if(err){console.log(err); }  else {
  console.log('Апвоут поставлен: '+new Date());
  }
});
}
}
});
};

function vp(){
golos.api.getAccounts([account], function(err, result){
	var power = result[0].voting_power;
	var votetime = Date.parse(result[0].last_vote_time);
		golos.api.getDynamicGlobalProperties(function(err, result) {  
			var curtime = Date.parse(result.time);
			golos.api.getConfig(function(err, result) {
				var regentime = 10000/result.STEEMIT_VOTE_REGENERATION_SECONDS;
			var volume =(power+((curtime-votetime)/1000)*regentime);
			var charge;
			if(volume>=10000){
			charge=100.00;
			}
			else charge=+(volume/100).toFixed(2);
			if(charge<=votepower){console.log('Текущий Уровень заряда VP '+'('+charge+'%)'+' меньше допустимого: '+votepower+'%'+'\nРобот деактивирован');process.exit(-1);}
			else if (up===true){posting();
			      console.log('Уровень заряда VP: '+charge+'%');}
	});
	});	
	});
};

function message(){
var number =getRandomInt(min, max);
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
var phrase=word[number];
return phrase;
};
