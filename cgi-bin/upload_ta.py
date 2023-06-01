#!/usr/bin/python3
import cgi
import cgitb
import os
import datetime
import subprocess

dst_path = '../html/table_annotator/pdf/'
alto_path = './table_annotator/withtag/'
log_path = './upload_ta_log.txt'

def return_responce():
    print('Content-Type: text/html')
    print('')
    print('<!DOCTYPE html>')
    print('<html>')
    print('<head>')
    print('<meta charset="UTF-8">')
    print('</head>')
    print('<title>Upload completed</title>')
    print('<body>')
    print('Upload completed.<br>')
    print('<a href="http://localhost/table_annotator/table_annotator.html?%s">To proceed, click here.</a>' % ('file=pdf/'+pdf_name))
    print('</body>')
    print('</html>')

def alto():
    with_tag_path = alto_path + pdf_name.replace('.pdf', '.withtag')
    if os.path.isfile(with_tag_path):
        return True
    command_line = './pdfalto.sh '+ dst_path+pdf_name + ' ' + alto_path+pdf_name.replace('.pdf', '.xml')
    if subprocess.call([command_line], shell=True) != 0:
        return False
    return True

cgitb.enable()
form = cgi.FieldStorage()
pdf_name = form['pdf'].filename

with open(log_path, 'a') as f:
    print('%s %s' % (datetime.datetime.now(), pdf_name), file=f)

with open(dst_path+pdf_name, 'wb') as f:
    f.write(form['pdf'].value)

return_responce()

alto()
