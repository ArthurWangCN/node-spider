var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const fs = require('fs');

var axios = require('axios');
const qs = require('qs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const puppeteer = require('puppeteer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const formData = {
  ids: '469142,397945,183198,887776,413057,183201,183202'
};
axios.post('https://www.9ku.com/playlist.php', qs.stringify(formData), {
  headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
  }
})
  .then(res => {
    console.log(res.data);
    const urls = []
    res.data.map(item => {
      urls.push(item.wma)
    })
    downloadMultipleMP3s(urls);
  });

  async function downloadMultipleMP3s(mp3Urls) {
    for (const url of mp3Urls) {
        await downloadMP3(url, './pdf');
        console.log(`MP3 file from ${url} downloaded and saved.`);
    }
}


async function downloadMP3(url, outputPath) {
  console.log('???');
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream' // 设置响应类型为流
        });

        const mp3FilePath = path.join(outputPath, `${url}.mp3`);
        const writer = fs.createWriteStream(mp3FilePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

const convertToPdf = async (links, page) => {
  let i = 0;
  while (i < 8) {
    console.log(links[i].href);
    await page.goto(links[i].href, { timeout: 60000 });
    await page.waitForTimeout(1000);
    await page.waitForSelector('#sidebar');
    await page.$eval('#sidebar', el => {
      el.style.display = 'none'
    })
    await page.waitForSelector('#content');
    await page.pdf({ path: `./pdf/${i}-${links[i].name}.pdf`, format: 'A4' });
    console.log(`正在打印第${i+1}页pdf`)
    i++;
  }
}

// (async() => {
//   try {
//     const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   // await page.waitForSelector('img', { visible: true, timeout: 60000 });
//   await page.goto('https://es6.ruanyifeng.com/');
//   await page.waitForSelector('#sidebar ol a', { visible: true, timeout: 60000 });
//   let links = await page.evaluate(() => {
//     return [...document.querySelectorAll('#sidebar ol a')].map(item => {
//       const { href, innerText: name } = item;
//       return {
//         href,
//         name
//       }
//     })
//   })
//   // console.log('>>>', links);
//   // await page.pdf({path: `./pdf/output-${new Date().getTime()}.pdf`, format: 'A4'});
//   await convertToPdf(links, page);
//   await browser.close();
//   } catch (error) {
//     console.error('xxxxxxxxxxxxxxx', error)
//   }
// })();

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message; 
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

