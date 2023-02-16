// import { path } from "path";
// import { os } from "os";
// import { app } from "electron";
// import { BrowserWindow } from "electron";
// import { Menu } from "electron";
// import { IpcMain } from "electron";
// import { Shell } from "electron";
// import { slash } from "slash";
// import imagemin from "imagemin";
// import imageminMozjpeg from "imagemin-mozjpeg";
// import imageminPngquant from "imagemin-pngquant";

const path = require("path");
const os = require("os");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const imageminPngquant = require("imagemin-pngquant");
const imagemin = require("imagemin");
const slash = require("slash");
const imageminMozjpeg = require("imagemin-mozjpeg");

// FIXME: Set env
// process.env.NODE_ENV = "development";
process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;
console.log(`platform = ${process.platform}`);

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image shrink",
    width: isDev ? 1500 : 500,
    height: 600,
    //, center: true
    //, icon: './assets/icons/Icon_256x256.png'
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: isDev,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  //mainWindow.setBackgroundColor('hsl(230, 100%, 50%)')
  //console.log(`${__dirname}/app/`)
  //mainWindow.loadURL(`file://${__dirname}/app/index.html`)

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadFile("./app/index.html");
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "About ImageShrink",
    width: 300,
    height: 300,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: "white",
  });

  aboutWindow.loadFile("./app/about.html");
}

//app.on("ready", createMainWindow);
app.on("ready", () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // globalShortcut.register("CmdOrCtrl+R", () => mainWindow.reload());
  // globalShortcut.register(isMac ? "Command+Alt+I" : "Ctrl+Shift+I", () =>
  //   mainWindow.toggleDevTools()
  // );

  mainWindow.on("closed", () => (mainWindow = null));
});

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { label: "About", click: createAboutWindow },
            { role: "quit" },
          ],
        },
      ]
    : []),

  {
    role: "fileMenu",
  },

  ...(!isMac
    ? [
        {
          label: "Help",
          click: createAboutWindow,
        },
        {
          role: "quit",
        },
      ]
    : []),

  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forceReload " },
            { type: "separator" },
            { role: "toggleDevTools" },
          ],
        },
      ]
    : []),
];

ipcMain.on("image:minimize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageshrink");
  console.log(options);
  shrinkImage(options);
});

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;
    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });
    console.log(files);
    shell.showItemInFolder(`${dest}/`);
  } catch (err) {
    console.log(err);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
