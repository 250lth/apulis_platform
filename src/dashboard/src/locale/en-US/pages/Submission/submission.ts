const index = {
    submitTrainingJob:'Submit Training Job',
    cluster:'Cluster',
    jobName:'Job Name',
    jobNameIsRequired:'Job Name is required！',
    jobTemplate:'Job Template',
    jobType:'Job Type',
    preemptibleJob:'Preemptible Job',
    deviceType:'Device Type',
    deviceNumber:'Number of Device',
    numberOfNodes:'Number of Nodes',
    totalNumberOfDevice:'Total Number of Device',
    noneApplyAtemplate:'None (Apply a Template)',
    regularJob:'Regular Job',
    distributedJob:'Distributed Job',
    dockerImage:'Docker Image',
    command:'Command',
    interactivePorts:'Interactive Ports',
    advanced:'ADVANCED',
    template:'TEMPLATE',
    submit:'SUBMIT',
}
const advance = {
    customDockerRegistry:'Custom Docker Registry',
    username:'Username',
    password:'Password',
    mountDirectories:'Mount directories',
    pathInContainer:'Path in container',
    pathOnHostMachineOrStorageServer:'Path on Host Machine / Storage Server',
    enable:'Enable',
    workPath:'Work Path',
    dataPath:'Data Path',
    jobPath:'Job Path',
    environmentVariables:'Environment Variables',
    name:'Name',
    value:'Value',
    environmentVariableName:'Environment Variable Name',
    environmentVariableValue:'Environment Variable Value',
    jobNameIsRequired:'Job Name is required',
    dockerImageIsRequired:'Docker Image is required',
    commandIsRequired:'Command is required',
    tensorboardListenTips:"TensorBoard will listen on directory ~/tensorboard/<JobId>/logs inside docker container."
}

const template = {
    templateManagements:'Template Managements',
    templateName:'Template name',
    scope:'Scope',
    save:'Save',
    delete:'Delete'
}
export default{
    ...index,
    ...advance,
    ...template
}