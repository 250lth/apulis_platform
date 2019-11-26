import React from "react"
import {
  Table,
  TableHead,
  TableRow, TableCell, TableBody, Button, Grid, FormControl, InputLabel, Select, MenuItem, TextField,
} from "@material-ui/core";
import axios from 'axios';

export default class Access extends React.Component {
  constructor() {
    super()
    this.state = {
      accessList: [],
      modifyFlag: false,
      isEdit: 0,
      identityName: '',
      resourceType: null,
      resourceName: null,
      permissions: null,
    }
  }

  componentWillMount() {
    this.getAccessList();
  }

  getAccessList = () => {
    axios.get('/api/qjydev/GetACL')
      .then((res) => {
        this.setState({
          accessList: res.data.result,
        })
      }, () => { })
  }

  addAccess = () => {
    const { modifyFlag } = this.state;
    this.setState({
      modifyFlag: !modifyFlag,
      isEdit: 0,
      identityName: '',
      resourceType: 1,
      resourceName: '',
      permissions: 1,
    })
  }

  updateAccess = (item) => {
    let resourceType, resourceName;
    if (item.resource === 'Cluster') {
      resourceType = 1;
    } else {
      resourceType = 2;
      resourceName = item.resource.split(':')[1];
    }
    const { modifyFlag } = this.state;
    this.setState({
      modifyFlag: !modifyFlag,
      identityName: item.identityName,
      resourceType,
      resourceName,
      permissions: item.permissions,
      isEdit: 1,
    })
  }

  save = () => {
    const { resourceType, resourceName, permissions, identityName } = this.state;
    let url = `/api/qjydev/updateAce?resourceType=${resourceType}&resourceName=${resourceName}&permissions=${permissions}&identityName=${identityName}`;
    axios.get(url).then((res) => {
      alert(`修改成功`)
      this.getAccessList();
    }, (e) => {
      console.log(e);
      alert(`修改失败`)
    })
  }

  delete = (item) => {
    let resourceType, resourceName;
    if (window.confirm('确认删除')) {
      if (item.resource === 'Cluster') {
        resourceType = 1;
      } else {
        resourceType = 2;
        resourceName = item.resource.split(':')[1];
      }
      let url = `/api/qjydev/deleteAce?resourceType=${resourceType}&resourceName=${resourceName}&identityName=${item.identityName}`;
      axios.get(url)
        .then((res) => {
          this.getAccessList();
        }, () => { })
    }
  }


  //change
  resourceTypeChange(e) {
    this.setState({
      resourceType: e.target.value
    })
  }

  resourceNameChange(e) {
    this.setState({
      resourceName: e.target.value
    })
  }

  permissionsChange(e) {
    this.setState({
      permissions: e.target.value
    })
  }

  identityNameChange(e) {
    this.setState({
      identityName: e.target.value
    })
  }

  render() {
    const { accessList, modifyFlag, isEdit, identityName, resourceType, resourceName, permissions } = this.state;
    return (
      <div>
        <Button variant="outlined" size="medium" color="primary" onClick={this.addAccess}>{modifyFlag && !isEdit ? '收起新增' : '新增ACCESS'}</Button>
        {
          modifyFlag ?
            <div style={{ width: '50%', padding: 10, margin: 10, borderWidth: 2, borderColor: '#999', borderStyle: 'solid' }}>
              <h2 id="simple-modal-title">{isEdit ? '编辑' : '新增'}</h2>
              {!isEdit ? <p>理论上不用新增，用户第三方登录后就会有ACL记录</p> : null}
              <form>

                {
                  isEdit === 1 ?
                    <div>
                      <Grid item xs={8}>
                        {identityName}
                      </Grid>
                      <Grid item xs={8}>
                        {resourceType === 1 ? 'Cluster' : 'Cluster/VC:' + resourceName}
                      </Grid>
                    </div>
                    :
                    <div>
                      <Grid item xs={8}>
                        <TextField
                          required
                          label="identityName"
                          value={identityName}
                          onChange={this.identityNameChange.bind(this)}
                          margin="normal"
                          fullWidth={true}
                        />
                      </Grid>
                      <Grid item xs={8}>
                        <FormControl>
                          <InputLabel id="demo-simple-select-label">resourceType</InputLabel>
                          <Select
                            value={resourceType}
                            onChange={this.resourceTypeChange.bind(this)}
                          >
                            <MenuItem value={1}>Cluster</MenuItem>
                            <MenuItem value={2}>VC</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {
                        resourceType === 2 ?
                          <Grid item xs={8}>
                            <TextField
                              required
                              label="resourceName"
                              value={resourceName}
                              onChange={this.resourceNameChange.bind(this)}
                              margin="normal"
                              fullWidth={true}
                            />
                          </Grid> : null
                      }
                    </div>
                }
                <Grid item xs={8}>
                  <FormControl>
                    <InputLabel id="demo-simple-select-label">permissions</InputLabel>
                    <Select
                      value={permissions}
                      onChange={this.permissionsChange.bind(this)}
                    >
                      <MenuItem value={0}>0</MenuItem>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={7}>7</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={8} style={{ marginTop: 10 }}>
                  <Button variant="outlined" size="medium" color="primary" type="button" onClick={this.save}>Save</Button>
                </Grid>
              </form>
            </div>
            : null
        }
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>identityId</TableCell>
              <TableCell>identityName</TableCell>
              <TableCell>isDeny</TableCell>
              <TableCell>permissions</TableCell>
              <TableCell>resource</TableCell>
              <TableCell>actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessList.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.identityId} </TableCell>
                <TableCell>{item.identityName} </TableCell>
                <TableCell>{item.isDeny} </TableCell>
                <TableCell>{item.permissions} </TableCell>
                <TableCell>{item.resource}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => this.updateAccess(item)}>Modify</Button>
                  <Button color="primary" onClick={() => this.delete(item)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
}