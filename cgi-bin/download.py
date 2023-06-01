#!/usr/bin/python3
import tarfile

def return_responce():
    print('Content-Type: text/html')
    print('')
    print('<!DOCTYPE html>')
    print('<html>')
    print('<head>')
    print('<meta charset="UTF-8">')
    print('</head>')
    print('<title>Download URL</title>')
    print('<body>')
    print('Download the data from following URL.<br>')
    print('<a href="http://localhost/table_annotator/gt_data.tar.gz">Click here.</a>')
    print('</body>')
    print('</html>')

with tarfile.open('../html/table_annotator/gt_data.tar.gz', 'w:gz') as t:
    t.add('./table_annotator/gt_str')
    t.add('./table_annotator/withtag')
    t.add('./table_annotator/dataset.csv')
    t.add('../html/table_annotator/pdf')

return_responce()
