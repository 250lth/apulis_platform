# AI 平台文档

## 整体说明

### 一、技术栈

前端部分使用了 React + Typescript + Material，使用 nodejs 的 koa 库来充当中间层的角色，来转发/整合数据，前端的请求先发到 koa 上，然后再由 koa 整合，发到 python 写的后端上，得到返回的数据后再由 koa 整合数据，返回给前端



### 二、 如何运行

在 dashboard/config 下，应有一个 local.yaml 文件，可以运行 deploy.py webui来生成这个文件，其作用是记录一写配置信息，在代码中使用

```javascript
const config = require('config')
```

便能读取到 local.yaml 的内容，当前正在使用的内容如下

```yaml
sign: "apulistechjwtsecretsample001"
winbind: "Will call /domaininfo/GetUserId with userName query to get the user's id info"
masterToken: "Access token of all users"

wechat:
  appId: "wx403e175ad2bf1d2d"
  appSecret: "dc8cb2946b1d8fe6256d49d63cd776d0"
 
userGroup:
  type: custom
  domain: http://sandbox2-master.sigsus.cn:52080
  backEndPath: /custom-user-dashboard-backend
  frontEndPath: /custom-user-dashboard
 
activeDirectory:
  tenant: "19441c6a-f224-41c8-ac36-82464c2d9b13"
  clientId: "6d93837b-d8ce-48b9-868a-39a9d843dc57"
  clientSecret: "eIHVKiG2TlYa387tssMSj?E?qVGvJi[]"

domain: "http://sandbox2-master.sigsus.cn:52080"
 
administrators:
  - jinlmsft@hotmail.com
  - jinli.ccs@gmail.com
  - jin.li@apulis.com
 
clusters:
  apulis-atlas01:
    restfulapi: "http://sandbox2-master.sigsus.cn:52080/apis"
    title: Grafana-endpoint-of-the-cluster
    workStorage: work
    dataStorage: data
    grafana: "http://sandbox2-master.sigsus.cn:52080/endpoints/grafana"
    prometheus: http://sandbox2-master.sigsus.cn:52080

```

yaml 文件可以理解成是一个没有 大括号 和 引号的 json

在配置好 local.yaml 文件后，可以本地运行 `nodemon/server `开启 node 服务，然后运行 `yarn run frontend` 开启前端开发环境

在 src/setupProxy.js 中，会将前端的 /api 开头的请求转发到本地的 3081 端口，也就是 nodejs 服务的端口。

如果想让前端和 nodejs 服务在同一个端口运行，那么 setupProxy.js 应该这样写：

```javascript
module.exports = (app) => {
  app.use('/api', require('../server/api').callback())
}
```

这样就可以使用自己写的 nodejs 来启动前端开发环境了，不方便的地方是每次改了 nodejs 的代码都要重新去运行`yarn run frontend` 重启服务，编译较慢



## 名词解释

teamId：用户 team 的 id（名称）

VC：virtual cluster 虚拟集群

vcName：虚拟集群的名称



## 业务流程

###  一、注册/登录/鉴权等

采用 OAuth 2 的登录方式，注意在开发环境下，由于 nodejs 程序监听的是另一个端口，在登录页面跳转后，需要再手动将浏览器地址换成 前端的地址（如果不想要这样，可以用 `yarn run dev` 命令来运行 nodejs 程序），但是在生产环境中，因为都在同一个域名下，没有这种问题

OAuth 2 登录完成之后，还需要填写用户名、密码等完成注册

[相关 api](./auth-api.md)



## 二、GPU Card 

这是根路径对应的页面，用于展示 GPU 的使用情况

[相关 api](./gpu-card-api.md)



## 三、Submit Training  Job

这是一个表单，用于提交 training job，提交成功会跳转到 /job/{userName}/apulis-dev/{jobId} 页面



这个页面会展示当前 job 的详情，包括 brief，mapped endpoints，job analytics and monitoring，console output。

其中，job analytics and monitoring 是一个 iframe 页面，是用于监控当前 job 的各种资源使用情况。

[相关 api](submit-training-job-api)



## 四、Submit Data Job

这是一个表单，用于提交 data job，提交成功后会跳转到 /job/{userName}/apulis-dev/{jobId} 页面，和上面的流程是一致的

[相关 api](./submit-data-job.md)



## 五、View And Manage Jobs

这个页面可以查看当前用户的 job 和 所有的 job。注意，当选择所有的 job 时，只会返回 pending 的job。点击 jobId 后会进入 /job/{userName}/apulis-dev/{jobId} 页面



## 六、Cluster Status

这个页面会展示

