function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
function formatMinutesTime(t){
  var str = parseInt(t / 60) + ":" + parseInt(t % 60);
  var arr = str.split(":");
  var newarr = arr.map(function(item){
    return item<10 ? "0"+item:item
  })
  return newarr[0] + ":" + newarr[1]
}

module.exports = {
  formatTime: formatTime,
  formatMinutesTime: formatMinutesTime
}
