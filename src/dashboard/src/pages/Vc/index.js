import React from "react"
import {
  Table, TableHead, TableRow, TableCell, TableBody, 
  Button, TextField, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText,
  CircularProgress, MenuItem, Select
} from "@material-ui/core";
import axios from 'axios';
import ClustersContext from "../../contexts/Clusters";
import message from '../../utils/message';
import { NameReg, NameErrorText, SameNameErrorText } from '../../const';
import './index.less';
import _ from 'lodash';
import AuthzHOC from '../../components/AuthzHOC';
import { Pagination } from '@material-ui/lab';

const empty = {
  text: '',
  error: false
}

export default class Vc extends React.Component {
  static contextType = ClustersContext
  constructor() {
    super()
    this.state = {
      vcList: [],
      modifyFlag: false,
      isEdit: 0, 
      vcName: '',
      vcNameValidateObj: empty,
      quotaValidateObj: {},
      deleteModifyFlag: false,
      btnLoading: false,
      allDevice: {},
      qSelectData: {},
      mSelectData: {},
      clickItem: {},
      page: 1,
      size: 10,
      count: 0
    }
  }

  componentDidMount() {
    const { selectedCluster, userName } = this.context;
    this.getVcList();
    axios.get(`/${selectedCluster}/getAllDevice?userName=${userName}`)
      .then((res) => {
        const allDevice = res.data;
        let qSelectData = {}, mSelectData = {}, quotaValidateObj = {};
        Object.keys(allDevice).forEach(i => {
          qSelectData[i] = null;
          mSelectData[i] = null;
          quotaValidateObj[i] = empty;
        });
        this.setState({ allDevice, qSelectData, mSelectData });
      })
  }

  getVcList = () => {
    const { page, size } = this.state;
    axios.get(`/${this.context.selectedCluster}/listVc?page=${page}&size=${size}`)
      .then((res) => {
        const { totalNum, result } = res.data;
        this.setState({
          vcList: result,
          count: Math.ceil(totalNum / size)
        })
      })
  }

  //新增VC
  addVc = () => {
    const { modifyFlag } = this.state;
    this.setState({
      modifyFlag: !modifyFlag,
      isEdit: 0,
      vcName: ''
    })
  }

  updateVc = (item) => {
    const { vcName, quota, metadata } = item;
    this.checkCountJobByStatus(vcName, () => {
      const { modifyFlag } = this.state;
      const qSelectData = JSON.parse(quota);
      const _mSelectData = JSON.parse(metadata);
      this.setState({
        modifyFlag: true,
        isEdit: 1,
        vcName: vcName,
        qSelectData,
        mSelectData: Object.keys(_mSelectData).length > 0 ? _mSelectData : {},
        clickItem: item
      })
    });
  }

  save = async () => {
    const { isEdit, vcName, vcNameValidateObj, qSelectData, mSelectData, allDevice, quotaValidateObj } = this.state;
    const { selectedCluster, getTeams } = this.context;
    let flag = true;
    if (!vcName || vcNameValidateObj.error) {
      this.setState({
        vcNameValidateObj: {
          error: true,
          text: vcNameValidateObj.text ? vcNameValidateObj.text : 'vcName is required！'
        }
      })
      return;
    }
    Object.keys(quotaValidateObj).forEach(i => {
      if (quotaValidateObj[i].error) flag = false;
    })
    if (!flag) return;
    let url, quota = {}, metadata = {}, canSave = true;
    if (Object.keys(allDevice).length > 0) {
      quota = _.cloneDeep(qSelectData);
      // metadata = _.cloneDeep(mSelectData);
      Object.keys(quota).forEach(i => {
        if (!allDevice[i]) { 
          delete quota[i];
          // delete metadata[i];
        }
        if (quota[i] === null) quota[i] = 0;
        // if (metadata[i] === null || !metadata[i]) metadata[i] = {user_quota: 0};
        // if (metadata[i].user_quota > quota[i]) {
        //   message('error', 'The value of metadata cannot be greater than the value of quota！');
        //   canSave = false;
        //   return;
        // }
      });
    }
    if (!canSave) return;
    quota = JSON.stringify(quota);
    metadata = JSON.stringify(metadata);
    this.setState({ btnLoading: true });
    url = `/${selectedCluster}/${isEdit ? 'updateVc' : 'addVc'}/${vcName}/${quota}/${metadata}`;
    await axios.get(url)
      .then((res) => {
        message('success', `${isEdit ? 'Modified' : 'Added'}  successfully！`);
        this.onCloseDialog();
        getTeams();
        this.getVcList();
      }, (e) => {
        message('error', `${isEdit ? 'Modified' : 'Added'}  failed！`);
      })
    this.setState({ btnLoading: false });
  }

  delete = () => {
    const { selectedCluster, getTeams } = this.context;
    const { vcName } = this.state.delItem;
    this.setState({ btnLoading: true });
    axios.get(`/${selectedCluster}/deleteVc/${vcName}`)
      .then((res) => {
        if (res.data.result === false) {
          message('error', 'Could not delete last VC');
          return;
        }
        message('success', 'Delete successfully！');
        this.setState({ deleteModifyFlag: false, btnLoading: false });
        getTeams();
        this.getVcList();
      }, () => { 
        message('error', 'Delete failed！');
        this.setState({ btnLoading: false });
      })
  }

  vcNameChange = e => {
    const { vcList } = this.state;
    const val = e.target.value;
    const hasNames = vcList.map(i => i.vcName);
    const error = !val || !NameReg.test(val) || hasNames.includes(val) ? true : false;
    const text = !val ? 'vcName is required！' : !NameReg.test(val) ? NameErrorText : hasNames.includes(val) ? SameNameErrorText : '';
    this.setState({ 
      vcName: val,
      vcNameValidateObj: {
        error: error,
        text: text
      }
    })
  }

  getSelectHtml = (type) => {
    const { allDevice, qSelectData, mSelectData, vcList, isEdit, clickItem, quotaValidateObj } = this.state;
    return Object.keys(allDevice).map(m => {
      const totalNum = allDevice[m].capacity;
      let val = null, options = {}, oldVal = {}, num = allDevice[m].capacity;
      if (type == 1) {
        val = qSelectData[m];
        oldVal = qSelectData;
      } else {
        // val =  mSelectData[m] && mSelectData[m].user_quota !== null ? mSelectData[m].user_quota : null;
        // oldVal = mSelectData;
      }
      vcList.forEach(n => {
        const useNum = JSON.parse(n.quota)[m];
        num = useNum ? (num - useNum < 0 ? 0 : num - useNum) : num;
      })
      options[m] = Number(num);
      const editData = isEdit ? JSON.parse(clickItem[type === 1 ? 'quota' : 'metadata'])[m] : null;
      const temp = editData && editData.constructor  === Object ? editData.user_quota : editData;
      const optionsData = temp ? editData + num : options[m];
      if (!isEdit && options[m] === 0) val = 0;
      const key = type === 1 ? 'qSelectData' : 'mSelectData';
      return (
        <div className="select-item">
          <TextField
            label="Type"
            variant="outlined"
            value={m}
            disabled
            className="select-key"
          />
          <TextField
            type="number"
            label="Value"
            variant="outlined"
            className="select-value"
            defaultValue={val}
            onChange={e => this.onNumValChange(key, oldVal, m, type, e.target.value, optionsData)}
            inputProps={{min: "0", max: optionsData, step: "1"}}
            error={quotaValidateObj[m] ? quotaValidateObj[m].error : false}
            helperText={quotaValidateObj[m] ? quotaValidateObj[m].text : ''}
          />
            {/* {this.getOptions(optionsData)}
          </TextField> */}
        </div>
      )
    })
  }

  onNumValChange = (key, oldVal, m, type, val, max) => {
    const _val = Number(val);
    const { quotaValidateObj } = this.state;
    if (!Number.isInteger(_val) || _val > max || _val < 0) {
      this.setState({
        quotaValidateObj: {
          ...quotaValidateObj,
          [m]: {
            error: true,
            text: `Must be a positive integer from 0 to ${max}`
          }
        }
      });
      return;
    } else {
      this.setState({
        quotaValidateObj: {
          ...quotaValidateObj,
          [m]: empty
        }
      });
    }
    this.setState({
      [key]: { ...oldVal, [m]: type === 1 ? _val : { user_quota: _val }}
    })
  }
  
  getOptions = (data) => {
    let content = [];
    for(let i = 0; i <= data; i++){
      content.push(<MenuItem key={i} value={i}>{i}</MenuItem>)
    }
    return content;
  }

  onClickDel = item => {
    const { vcName } = item;
    this.checkCountJobByStatus(vcName, () => {
      this.setState({ deleteModifyFlag: true, delItem: item })
    });
  }

  checkCountJobByStatus = (vcName, callback) => {
    const { selectedCluster, userName } = this.context;
    const targetStatus = encodeURIComponent('running,scheduling,killing,pausing');
    axios.get(`/${selectedCluster}/countJobByStatus/${targetStatus}/${vcName}`)
    .then((res) => {
      if (res.data > 0) {
        message('warning','No running, scheduling, killing, or pausing job is required to perform operations!');
        return
      } else {
        callback();
      }
    })
  }

  onCloseDialog = () => {
    let qSelectData = this.state.qSelectData;
    Object.keys(qSelectData).forEach(i => qSelectData[i] = 0);
    this.setState({
      modifyFlag: false,
      vcNameValidateObj: empty,
      quotaValidateObj: {},
      qSelectData,
    })
  }

  onPageChange = (e, page) => {
    this.setState({ page }, () => {
      this.getVcList();
    });
  }

  onSizeChange = (e) => {
    this.setState({ size: Number(e.target.value) }, () => {
      this.getVcList();
    });
  }

  render() {
    const { vcList, modifyFlag, isEdit, vcName, deleteModifyFlag, btnLoading, qSelectData, mSelectData, 
      allDevice, vcNameValidateObj, page, count, size } = this.state;
    return (
      <Container fixed maxWidth="xl">
        <div style={{marginLeft: 'auto', marginRight: 'auto'}}>
          <AuthzHOC needPermission={'MANAGE_VC'}>
            <div><Button variant="outlined" size="medium" color="primary" onClick={this.addVc}>ADD</Button></div>
          </AuthzHOC>
          <Table style={{ margin: '20px 0' }}>
            <TableHead> 
              <TableRow style={{ backgroundColor: '#3f51b5' }}>
                <TableCell style={{ color: '#fff' }}>VcName</TableCell>
                <TableCell style={{ color: '#fff' }}>quota</TableCell>
                {/* <TableCell style={{ color: '#fff' }}>metadata</TableCell> */}
                <TableCell style={{ color: '#fff' }}>permissions</TableCell>
                <AuthzHOC needPermission={'MANAGE_VC'}><TableCell style={{ color: '#fff' }}>actions</TableCell></AuthzHOC>
              </TableRow>
            </TableHead>
            <TableBody>
              {vcList.map(item => (
                <TableRow key={item.vcName}>
                  <TableCell>{item.vcName} </TableCell>
                  <TableCell>{item.quota} </TableCell>
                  {/* <TableCell>{item.metadata} </TableCell> */}
                  <TableCell>{item.admin ? 'Admin' : 'User'} </TableCell>
                  <AuthzHOC needPermission={'MANAGE_VC'}>
                    <TableCell>
                      <Button color="primary" onClick={() => this.updateVc(item)}>Modify</Button>
                      <Button color="secondary" disabled={item.vcName === this.context.selectedTeam} 
                        onClick={() => this.onClickDel(item)}>Delete</Button>
                    </TableCell>
                  </AuthzHOC>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            color="primary"
            count={count}
            page={page}
            style={{ float: 'right', marginLeft: 20 }}
            onChange={this.onPageChange}
          />
          <Select
            value={size}
            style={{ float: 'right' }}
            onChange={this.onSizeChange}
            displayEmpty
          >
            <MenuItem value={10}>10 rows</MenuItem>
            <MenuItem value={20}>20 rows</MenuItem>
            <MenuItem value={30}>30 rows</MenuItem>
            <MenuItem value={40}>40 rows</MenuItem>
            <MenuItem value={50}>50 rows</MenuItem>
          </Select>
          {modifyFlag && 
          <Dialog open={modifyFlag} disableBackdropClick maxWidth='xs' fullWidth>
            <DialogTitle>{isEdit ? 'Modify' : 'ADD'}</DialogTitle>
            <DialogContent dividers>
              <form>
                <TextField
                  label="vcName *"
                  value={vcName}
                  onChange={this.vcNameChange}
                  margin="normal"
                  error={vcNameValidateObj.error}
                  fullWidth={true}
                  disabled={isEdit}
                  helperText={vcNameValidateObj.text}
                  inputProps={{ maxLength: 20 }}
                />
                <h3>quota</h3>
                {Object.keys(allDevice).length > 0 && this.getSelectHtml(1)}
                {/* <h3>metadata/user_quota</h3>
                {Object.keys(allDevice).length > 0 && this.getSelectHtml(2)} */}
              </form>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.onCloseDialog} color="primary" variant="outlined">Cancel</Button>
              <Button onClick={this.save} color="primary" variant="contained" disabled={btnLoading} style={{ marginLeft: 8 }}>
                {btnLoading && <CircularProgress size={20}/>}Save
              </Button>
            </DialogActions>
          </Dialog>}
          {deleteModifyFlag && 
          <Dialog open={deleteModifyFlag} maxWidth='xs' fullWidth onClose={() => this.setState({ deleteModifyFlag: false })}>
            <DialogTitle>Delete</DialogTitle>
            <DialogContent>
              <DialogContentText>Are you sure to delete this VC？</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => this.setState({ deleteModifyFlag: false })} color="primary" variant="outlined">Cancel</Button>
              <Button onClick={this.delete} color="secondary" variant="contained" disabled={btnLoading} style={{ marginLeft: 8 }}>
                {btnLoading && <CircularProgress size={20}/>}Delete
              </Button>
            </DialogActions>
          </Dialog>}
        </div>
      </Container>
    )
  }
}