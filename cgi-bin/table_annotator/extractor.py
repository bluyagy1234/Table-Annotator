#!/usr/bin/python3
import datetime
import json
import sys
import os
import codecs
import re
import xml.etree.ElementTree as ET

class Token:
    def __init__(self, text="", left="", right="", top="", bottom="", token_id=""):
        self.text = text
        self.left = float(left)
        self.right = float(right)
        self.top = float(top)
        self.bottom = float(bottom)
        self.token_id = token_id

def extract(file, page, table_left, table_right, table_top, table_bottom):
    with codecs.open(file, "r", "utf_8", "ignore") as f:
        XMLData = f.read()

    root = ET.fromstring(XMLData)

    token_list = []
    for e in list(root.iter("{http://www.loc.gov/standards/alto/ns-v3#}String")):
        if e.get("ID").startswith("p" + str(page) + "_"):
            text = e.get("CONTENT")
            text = re.sub(r"\s", r"\$", text)
            text = text.replace("\\$", "")
            left = float(e.get("HPOS"))
            width = float(e.get("WIDTH"))
            right = left + width
            top = float(e.get("VPOS"))
            height = float(e.get("HEIGHT"))
            bottom = top + height
            token_id = e.get("ID")
            if table_left <= left and right <= table_right and table_top <= top and bottom <= table_bottom:
                token_list.append(Token(text, left, right, top, bottom, token_id))
    return token_list

table_info = sys.stdin.readline()
table_json = json.loads(table_info)

file = "withtag/"+table_json["pdf_name"].split("/")[-1].replace(".pdf", ".withtag")
page = table_json["table_page"]+1
with codecs.open(file, "r", "utf_8", "ignore") as fp:
    XMLData = fp.read()
    root = ET.fromstring(XMLData)
    for Page in root.iter("{http://www.loc.gov/standards/alto/ns-v3#}Page"):
        if Page.get("ID") == "Page" + str(page):
            pdf_size = {"width": float(Page.get("WIDTH")), "height": float(Page.get("HEIGHT"))}
            break

height_rate = pdf_size["height"]/table_json["canvas_heigt"]
width_rate = pdf_size["width"]/table_json["canvas_width"]

tokens_list = extract("withtag/"+table_json["pdf_name"].split("/")[-1].replace(".pdf", ".withtag"), table_json["table_page"]+1, \
                      table_json["table_left"]*width_rate, table_json["table_right"]*width_rate, \
                      table_json["table_top"]*height_rate, table_json["table_bottom"]*height_rate)

tokens_dict = {"tokens":[]}
for token in tokens_list:
    token_val = {}
    token_val["id"] = token.token_id
    token_val["text"] = token.text
    token_val["upper_x"] = token.left/width_rate
    token_val["upper_y"] = token.top/height_rate
    token_val["lower_x"] = token.right/width_rate
    token_val["lower_y"] = token.bottom/height_rate
    tokens_dict["tokens"].append(token_val)

response = tokens_dict
print("Content-type: text/html\n")
print(json.JSONEncoder().encode(response))
