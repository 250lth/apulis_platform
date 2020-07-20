import json
import os
import time
import argparse
import uuid
import subprocess
import sys
import datetime

import yaml
from jinja2 import Environment, FileSystemLoader, Template
import base64

import re

import thread
import threading
import random
import shutil
import textwrap
import logging
import logging.config

from multiprocessing import Process, Manager

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)),"../storage"))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)),"../utils"))

from jobs_tensorboard import GenTensorboardMeta
import k8sUtils

from config import config
from DataHandler import DataHandler

from cluster_manager import setup_exporter_thread, manager_iteration_histogram, register_stack_trace_dump, update_file_modification_time

logger = logging.getLogger(__name__)



def create_log(logdir = '/var/log/dlworkspace'):
    if not os.path.exists(logdir):
        os.system("mkdir -p " + logdir)
    with open('logging.yaml') as f:
        logging_config = yaml.load(f)
        f.close()
        logging_config["handlers"]["file"]["filename"] = logdir+"/dataconvert.log"
        logging.config.dictConfig(logging_config)

def insert_status_to_dataset(datasetId,projectId,status,out_path=None):
    dataset_info_path = os.path.join(config["data_platform_path"],"private/account/%s/membership.json" % (projectId))
    with open(dataset_info_path,"r") as f:
        infos = json.loads(f.read())
    if "dataSets" in infos:
        if datasetId in infos["dataSets"]:
            one_info = infos["dataSets"][datasetId]
            if "convertStatus" in one_info:
                logging.info("dataset: %s %s update status again!" % (projectId,datasetId))
            one_info["convertStatus"] = status
            one_info["convertOutPath"] = out_path
            with open(dataset_info_path,"w") as f:
                f.write(json.dumps(infos,indent=4, separators=(',', ':')))

index = 0
def merge_json_to_coco_dataset(list_ppath,json_path,coco_file_path,prefix="",args=None):
    coco = {}
    coco["images"] = []
    coco["categories"] = []
    coco["annotations"] = []
    with open(os.path.join(list_ppath, "list.json"), "r") as f:
        ImgIDs = json.load(f)["ImgIDs"]
    categories = {}
    for ImgID in ImgIDs:
        new_image_id = ImgID
        with open(os.path.join(json_path, 'images', "{}.json".format(ImgID)), "r") as f:
            json_dict = json.load(f)
        json_dict["images"][0]["file_name"] = "{}.jpg".format(new_image_id)
        json_dict["images"][0]["id"] = new_image_id
        for i in json_dict["annotations"]:
            i["image_id"] = new_image_id
            global index
            i["id"] = index
            index += 1
            if i["category_id"] not in categories:
                categories[i["category_id"]] = {"id":i["category_id"],"name":i["category_id"],"supercategory":i["category_id"]}
                if "category_name" in i:
                    categories[i["category_id"]]["name"] = i["category_name"]
                if "supercategory" in i:
                    categories[i["category_id"]]["supercategory"] = i["supercategory"]
        coco["images"].extend(json_dict["images"])
        coco["annotations"].extend(json_dict["annotations"])
        # source_path = os.path.join(json_path, 'images', "{}.jpg".format(ImgID))
        # if args and not args.ignore_image:
        #     shutil.copyfile(source_path, os.path.join(coco_image_path, "{}.jpg".format(new_image_id)))
    coco["categories"] = list(map(lambda x:x[1],sorted([[k,v] for k,v in categories.items()],key=lambda x:x[0])))
    with open(coco_file_path, "w") as f:
        f.write(json.dumps(coco, indent=4, separators=(',', ':')))

def DoDataConvert():
    dataHandler = DataHandler()
    jobs = dataHandler.getConvertList(targetStatus="queued")
    for oneJob in jobs:
        if oneJob["type"] == "image" and oneJob["targetFormat"]=="coco":
            try:
                list_path = os.path.join(config["data_platform_path"], "public/tasks/%s" % (oneJob["datasetId"]))
                json_path = os.path.join(config["data_platform_path"], "private/tasks/%s/%s" % (oneJob["datasetId"], oneJob["projectId"]))
                coco_file_path = os.path.join(config["data_platform_path"], "private/tasks/%s/%s/convert_coco.json" % (oneJob["datasetId"], oneJob["projectId"]))
                logging.info("=============start convert to format %s" % (oneJob["targetFormat"]))
                merge_json_to_coco_dataset(list_path,json_path,coco_file_path)
                dataHandler.updateConvertStatus("finished",oneJob["id"],coco_file_path)
                insert_status_to_dataset(oneJob["datasetId"], oneJob["projectId"],"finished",coco_file_path)
                logging.info("=============convert to format %s done" % (oneJob["targetFormat"]))
            except Exception as e:
                logging.exception(e)
                dataHandler.updateConvertStatus("error", oneJob["id"],e)
                insert_status_to_dataset(oneJob["datasetId"], oneJob["projectId"],"error")

def Run():
    register_stack_trace_dump()
    create_log()
    logger.info("start to DoDataConvert...")

    while True:
        update_file_modification_time("DataConvert")

        with manager_iteration_histogram.labels("data_convert").time():
            try:
                DoDataConvert()
            except Exception as e:
                logger.exception("do dataConvert failed")
        time.sleep(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", "-p", help="port of exporter", type=int, default=9209)
    args = parser.parse_args()
    setup_exporter_thread(args.port)

    Run()