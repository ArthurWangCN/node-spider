var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const fs = require("fs");

var axios = require("axios");
const qs = require("qs");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const puppeteer = require("puppeteer");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

const formData = {
  ids: "469142,397945,183198,887776,413057,183201,183202",
};
axios
  .post("https://www.9ku.com/playlist.php", qs.stringify(formData), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
  .then((res) => {
    const musicList = res.data;
    downloadMultipleMP3s(musicList);
  });

const downloadDir = './download/music';
async function downloadMultipleMP3s(musicList) {
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }
  for (const music of musicList) {
    await downloadMP3(music, downloadDir);
    console.log(`MP3 file from ${music.wma} downloaded and saved.`);
  }
}

async function downloadMP3(music, outputPath) {
  try {
    const response = await axios({
      method: "get",
      url: music.wma,
      responseType: "stream", // 设置响应类型为流
    });

    const mp3FilePath = path.join(outputPath, `${music.mname}.mp3`);
    const writer = fs.createWriteStream(mp3FilePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
