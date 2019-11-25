import React from "react"
import {
  Table,
  TableHead,
  TableRow, TableCell, TableBody, Button, TextField, Grid,
} from "@material-ui/core";
import axios from 'axios';

export default class Vc extends React.Component {
  constructor() {
    super()
    this.state = {
      vcList: [],
      modifyFlag: false,
      isEdit: 0,
      vcName: '',
      quota: '',
      metadata: '',
    }
  }

  componentWillMount() {
    this.getVcList();
  }

  getVcList = () => {
    axios.get('/api/qjydev/listVc')
      .then((res) => {
        this.setState({
          vcList: res.data.result,
        })
      }, () => { })
  }

  //新增VC
  addVc = () => {
    const { modifyFlag } = this.state;
    this.setState({
      modifyFlag: !modifyFlag,
      isEdit: 0,
      vcName: '',
      quota: '',
      metadata: '',
    })
  }

  updateVc = (item) => {
    const { modifyFlag } = this.state;
    this.setState({
      modifyFlag: !modifyFlag,
      isEdit: 1,
      vcName: item.vcName,
      quota: item.quota,
      metadata: item.metadata,
    })
  }

  save = () => {
    const { isEdit, vcName, quota, metadata } = this.state;
    let url;
    if (isEdit) {
      url = `/api/qjydev/updateVc/${vcName}/${quota}/${metadata}`;
    } else {
      url = `/api/qjydev/addVc/${vcName}/${quota}/${metadata}`;
    }
    axios.get(url)
      .then((res) => {
        alert(`${isEdit ? '修改' : '新增'}成功`)
      }, (e) => {
        console.log(e);
        alert(`${isEdit ? '修改' : '新增'}失败`)
      })
  }

  delete = (item) => {
    const { vcList } = this.state;
    if (vcList.length === 1) {
      alert('必须保留一个vc');
      return;
    }
    if (window.confirm('确认删除')) {
      axios.get(`/api/qjydev/deleteVc/${item.vcName}`)
        .then((res) => {
          this.getVcList();
        }, () => { })
    }
    // 删除逻辑todo: 关联的表记录删除
  }

  //change
  vcNameChange(e) {
    this.setState({
      vcName: e.target.value
    })
  }

  quotaChange(e) {
    this.setState({
      quota: e.target.value
    })
  }

  metadataChange(e) {
    this.setState({
      metadata: e.target.value
    })
  }

  render() {
    const { vcList, modifyFlag, isEdit, vcName, quota, metadata } = this.state;
    return (
      <div>
        <Button variant="outlined" size="medium" color="primary" onClick={this.addVc}>{modifyFlag && !isEdit ? '收起新增' : '新增VC'}</Button>
        {
          modifyFlag ?
            <div style={{ width: '50%', padding: 10, margin: 10, borderWidth: 2, borderColor: '#999', borderStyle: 'solid' }}>
              <h2 id="simple-modal-title">{isEdit ? '编辑' : '新增'}</h2>
              <form>
                <Grid item xs={8}>
                  <TextField
                    required
                    label="vcName"
                    value={vcName}
                    onChange={this.vcNameChange.bind(this)}
                    margin="normal"
                    fullWidth={true}
                  />
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    required
                    label="quota"
                    value={quota}
                    onChange={this.quotaChange.bind(this)}
                    margin="normal"
                    fullWidth={true}
                  />
                </Grid>
                <Grid item xs={8}>
                  <TextField
                    required
                    label="metadata"
                    value={metadata}
                    onChange={this.metadataChange.bind(this)}
                    margin="normal"
                    fullWidth={true}
                  />
                </Grid>
                <Grid item xs={8}>
                  <Button variant="outlined" size="medium" color="primary" type="button" onClick={this.save}>Save</Button>
                </Grid>
              </form>
            </div>
            : null
        }
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>vcName</TableCell>
              <TableCell>quota</TableCell>
              <TableCell>metadata</TableCell>
              <TableCell>admin</TableCell>
              <TableCell>actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vcList.map(item => (
              <TableRow key={item.vcName}>
                <TableCell>{item.vcName} </TableCell>
                <TableCell>{item.quota} </TableCell>
                <TableCell>{item.metadata} </TableCell>
                <TableCell>{item.admin ? '管理员' : '用户'} </TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => this.updateVc(item)}>Modify</Button>
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