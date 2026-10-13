import json,re,urllib.request,sys
P=json.load(open('playlists.json'))
def get(id):
    req=urllib.request.Request(f"https://www.youtube.com/playlist?list={id}",headers={"Accept-Language":"en","User-Agent":"Mozilla/5.0"})
    h=urllib.request.urlopen(req,timeout=30).read().decode()
    m=re.search(r"var ytInitialData = (\{.*?\});</script>",h)
    d=json.loads(m.group(1)); out=[]
    def walk(o):
        if isinstance(o,dict):
            l=o.get('lockupViewModel')
            if l and l.get('contentType')=='LOCKUP_CONTENT_TYPE_VIDEO':
                m=l['metadata']['lockupMetadataViewModel']
                try: a=m['metadata']['contentMetadataViewModel']['metadataRows'][0]['metadataParts'][0]['text']['content']
                except Exception: a=''
                out.append({"id":l['contentId'],"t":m['title']['content'],"a":a}); return
            r=o.get('playlistVideoRenderer')
            if r and r.get('isPlayable',True) and 'videoId' in r:
                t=''.join(x.get('text','') for x in r['title'].get('runs',[])) or r['title'].get('simpleText','')
                a=''.join(x.get('text','') for x in r.get('shortBylineText',{}).get('runs',[]))
                out.append({"id":r['videoId'],"t":t,"a":a,"d":r.get('lengthText',{}).get('simpleText','')})
            else:
                for v in o.values(): walk(v)
        elif isinstance(o,list):
            for v in o: walk(v)
    walk(d)
    seen=set(); return [x for x in out if not (x['id'] in seen or seen.add(x['id']))]
ok=[]
for p in P:
    try:
        tr=get(p['list']); print(p['key'],len(tr),file=sys.stderr)
        if tr: json.dump(tr,open(f"data/{p['key']}.json","w")); ok.append(p['key'])
    except Exception as e: print(p['key'],'ERR',e,file=sys.stderr)
