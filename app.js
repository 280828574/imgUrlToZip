let request = require("request");
let fs = require("fs");
let JSZip = require("jszip"); //引用jszip模块
let image = require("imageinfo"); //引用imageinfo模块

// 图片路径名称
let fileName = "imgs";
//文件夹路径  有的地方需要拼接 '/'， 为了减少拼接
let folderPaths = `./${fileName}/`;
let num = 0;
// 图片数据
let arr = [
    {
        url: "https://odm-redant.obs.cn-east-2.myhuaweicloud.com/2021-03-17/farmer_avatar_132x132.png",
    },
    {
        url: "https://odm-count.obs.cn-east-2.myhuaweicloud.com:443/2021-08-07%2Ffe131b6b3dd84c998d86e872fa5f9092.jpg",
    },
    {
        url: "https://odm-count.obs.cn-east-2.myhuaweicloud.com:443/2021-08-07%2F81c28028a9c6425bbb65343713767630.jpg",
    },
];

// 根据URL创建图片
let createdImgByUrl = (url, name) => {
    request(url)
        .pipe(fs.createWriteStream(folderPaths + name))
        .on("finish", function () {
            num++;
            if (num === arr.length) {
                statrToZip();
            }
        });
};
// 开始创建图片
const startToCreatedImg = function () {
    // 创建图片目录
    fs.exists(`${fileName}`, function (exists) {
        if (!exists) {
            fs.mkdirSync(`./${fileName}`);
        }
        arr.forEach(item => {
            let sign = item.url.lastIndexOf("/");
            let name = "";
            if (sign !== -1) {
                name = item.url.substr(sign + 1);
            }
            createdImgByUrl(item.url, name);
        });
    });
};

// 查找指定文件夹里的所有文件
const readFileList = function (path, filesList) {
    let files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        let stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList);
        } else {
            let obj = {}; //定义一个对象存放文件的路径和名字
            obj.path = path; //路径
            obj.filename = itm; //名字
            filesList.push(obj);
        }
    });
};

//获取文件夹下的所有文件
const getFileList = function (path) {
    let filesList = [];
    readFileList(path, filesList);
    return filesList;
};

//获取文件夹下的所有图片
const getImageFiles = function (path) {
    let imageList = [];
    getFileList(path).forEach(item => {
        let ms = image(fs.readFileSync(item.path + item.filename));
        ms.mimeType && imageList.push(item.filename);
    });
    return imageList;
};

// 开始压缩
const statrToZip = function () {
    let zip = new JSZip();
    let lists = getImageFiles(folderPaths); //获取文件夹里的所有图片文件值
    console.log('lists :>> ', lists);
    for (let i = 0; i < lists.length; i++) {
        let data = fs.readFileSync(folderPaths + lists[i]);
        var imgFile = zip.folder(lists[i])
        imgFile.file(lists[i], data, { base64: true });
        
    }
    zip.generateNodeStream({ type: "nodebuffer", streamFiles: true })
        .pipe(fs.createWriteStream("img.zip")) //打包后的包名可以自己根据需求定义，路径可以根据需求更改
        .on("finish", function () {
            console.log("压缩成功!"); //管道写完数据后，打印出提示
        });
};
startToCreatedImg();
