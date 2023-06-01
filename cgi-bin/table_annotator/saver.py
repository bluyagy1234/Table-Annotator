#!/usr/bin/python3
import datetime
import json
import sys
import os
import codecs
import glob
import xml.etree.ElementTree as ET
from contextlib import redirect_stdout

def get_max_row_col(cs):
    m_row, m_col = -1, -1
    for ce in cs:
        if m_row < int(ce["end_row"].strip()):
            m_row = int(ce["end_row"].strip())
        if m_col < int(ce["end_col"].strip()):
            m_col = int(ce["end_col"].strip())
    return m_row, m_col

csv_path = "./dataset.csv"
gt_path = "./gt_str/"

table_info = sys.stdin.readline()
table_json = json.loads(table_info)

file = 'withtag/'+table_json['pdf_name'].split('/')[-1].replace('.pdf', '.withtag')
page = table_json['table_page']+1
with codecs.open(file, 'r', 'utf_8', 'ignore') as fp:
    XMLData = fp.read()
    root = ET.fromstring(XMLData)
    for Page in root.iter("{http://www.loc.gov/standards/alto/ns-v3#}Page"):
        if Page.get('ID') == "Page" + str(page):
            pdf_size = {'width': float(Page.get('WIDTH')), 'height': float(Page.get('HEIGHT'))}
            break

height_rate = pdf_size['height']/table_json['canvas_heigt']
width_rate = pdf_size['width']/table_json['canvas_width']

pdf_name = table_json['pdf_name'].split('/')[-1].replace(".pdf", "")
table_num = 0
pdfs = glob.glob(gt_path+pdf_name+"*.xml")
for pdf in pdfs:
    pdf = pdf.split("/")[-1].replace(".xml", "")
    if table_num < int(pdf.split("_")[-1]):
        table_num = int(pdf.split("_")[-1])
table_num += 1

table_id = pdf_name + "_" + str(table_num)

input_line = ','.join([table_id, '['+str(table_json['table_left']*width_rate), str(table_json['table_top']*height_rate)+']',\
                    '['+str(table_json['table_right']*width_rate), str(table_json['table_bottom']*height_rate)+']', str(table_json['table_page']+1),\
                    table_json['pdf_name'],\
                    'withtag/'+table_json['pdf_name'].split('/')[-1].replace('.pdf', '.withtag')])

cells  = table_json["str"]
doc = ET.Element("document")
doc.attrib["filename"] = table_id+".xml"
tab = ET.SubElement(doc, "table")
max_row, max_col = get_max_row_col(cells)
tab.attrib["col"] = str(max_col+1)
tab.attrib["row"] = str(max_row+1)
cell_id = 1
for cell in cells:
    c = ET.SubElement(tab, "cell")
    c.attrib["id"] = str(cell_id)
    c.attrib["start-col"] = cell["start_col"].strip()
    c.attrib["end-col"] = cell["end_col"].strip()
    c.attrib["start-row"] = cell["start_row"].strip()
    c.attrib["end-row"] = cell["end_row"].strip()
    if int(cell["start_col"].strip()) < int(cell["end_col"].strip()):
        c.attrib["multiple"] = "row"
    elif int(cell["start_row"].strip()) < int(cell["end_row"].strip()):
        c.attrib["multiple"] = "column"
    t = []
    for token in cell["content"]:
        t.append(token["text"])
    con = ET.SubElement(c, "content")
    con.text = " ".join(t)
    for token in cell["content"]:
        tok = ET.SubElement(c, "token")
        tok.attrib["id"] = token["id"]
    cell_id += 1
tree = ET.ElementTree(doc)
tree.write(gt_path+table_id+".xml")
with open(csv_path, "a") as f:
    print(input_line, file=f)
response = {"info":"completed"}
print('Content-type: text/html\n')
print(json.JSONEncoder().encode(response))
