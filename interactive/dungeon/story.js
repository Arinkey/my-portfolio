(() => {
  const storyEl = document.getElementById('story');
  const restartBtn = document.getElementById('restart');
  const initialState = () => ({hasKey:false,knowsName:false,hasSword:false,hasTreasure:false,hasWeak:false,callsName:false});
  let state = initialState();
  let locked = false;

  const P = (...paras) => paras;
  const scenes = {
    start: () => ({
      paras:P('勇者睁开了眼睛，眼前一阵恍惚。','他再次回到了迷宫城的门口。也就是说，这一次，他还是没能战胜魔王。'),
      choices:[C('不过，只要再来一次的话……','start_after')]
    }),
    start_after:()=>({paras:P('迷宫城的内部千变万化，这一回的入口是他之前从来没有尝试过的。他并不知道里面会发生什么。可是，无论如何，他都必须继续前进才行。'),choices:[C('于是，勇者踏入眼前的这扇门。','hallway')]}),
    hallway:()=>({
      paras:P('进入门廊之后，走廊很快就分成了两个区域。','一边是一扇金碧辉煌的门，另一个方向，却有细小的声音，轻轻地叫着他……','“勇者大人，勇者大人。”','这会是一个陷阱吗？', ...(state.knowsName?['那不是一个陷阱，勇者已经知道了这一点。']:[])),
      choices: state.knowsName
        ? [C('这次，也许可以换一条路了。（继续前往金色房间）','gold_room'),C('再走一次走过的路？（前往声音）','frog_room')]
        : [C('没必要为了可疑的陷阱改路（继续前往金色房间）','gold_room'),C('如果不是陷阱呢？（前往声音）','frog_room')]
    }),
    gold_room:()=> state.hasKey ? ({paras:P('勇者推开了金色的门。靠近门时，就能听见里面响起的悦耳琴声。门后，一道金色的光芒将勇者的脸庞点亮，一把金色的里拉琴自动地演奏者。','在里拉琴的旁边，本该有一把金色的钥匙。','不过，钥匙现在已经在勇者的身上了。'),choices:[C('继续前进','moving')]}) : ({paras:P('勇者推开了金色的门。靠近门时，就能听见里面响起的悦耳琴声。门后，一道金色的光芒将勇者的脸庞点亮，一把金色的里拉琴自动地演奏者。','在里拉琴的旁边，有一把金色的钥匙。'),choices:[C('拿起钥匙。','gold_key',{hasKey:true})]}),
    gold_key:()=>({paras:P('勇者获得了钥匙。'),choices:[C('继续前进','moving')]}),
    frog_room:()=>({paras: state.knowsName?P('勇者顺着那细小的声音走去。','勇者的旧朋友，青蛙，依然在水边。'):P('勇者顺着那细小的声音走去。','那不是一间显眼的房间。石壁微微潮湿，地面上积着一层水光。','一只小小的青蛙正蹲在水边。它抬起头，看见勇者，没有逃走，只是眨了眨眼睛。'),choices:[C('伸手捧起青蛙。',state.knowsName?'frog_repeat':'frog_first_1')]}),
    frog_first_1:()=>({paras:P('“勇者大人！”青蛙说，“我一直在等你。我想和你成为朋友！”'),choices:[C('“为什么？”','frog_first_2')]}),
    frog_first_2:()=>({paras:P('“我也不知道。”青蛙歪着脑袋，“但是，总觉得我们好像之前遇到过一样……”','勇者和青蛙一同坐在水边，说了许多的话。'),choices:[C('勇者明白自己不得不上路了','frog_first_3')]}),
    frog_first_3:()=>({paras:P('“谢谢你。”勇者起身，将手按压在剑柄上，说，“我很久没有这样放松过了。”','“那么……”小青蛙小心翼翼地问，“我们是朋友了吗？”'),choices:[C('“是的。”','frog_first_4')]}),
    frog_first_4:()=>({paras:P('“太好了！”小青蛙轻快地跳跃起来，一跳就跳到了勇者的肩膀上。它不好意思地碰碰勇者的脸，然后说——','“如果你是来讨伐那个魔王的，就让我告诉你魔王的名字吧。”它说，“因为，名字是很重要的。”'),choices:[C('勇者知晓了魔王的名字。','moving',{knowsName:true})]}),
    frog_repeat:()=>({paras:P('“勇者大人！”青蛙愉快地说，“你又来了！我是你的朋友小青蛙，祝你这次好运！我也很高兴见到你，但是，也许你应该多尝试尝试不同的路径……来得到成功。”','勇者沉稳地点了点头。'),choices:[C('继续前进','moving')]}),
    moving:()=>({paras:P('在经历了刚才的放松后，勇者刚刚向前迈去，就忽然看见刻画着宝藏符号的房门在眼前，一闪而过。整座迷宫正在移动。','也许，他应该追上去了，一直追逐到这扇门停止为止。','又或许，他应该停下来，找到能更快抵达魔王所在之处的道路……'),choices:[C('追逐','chase'),C('留下','stay')]}),
    chase:()=>({paras:P('勇者快速地追逐上去，然后就被金闪闪的金子闪花了眼睛。——这么多的珠宝！就算是随便掏起一把，也够一个人花上半辈子了。'),auto:state.hasTreasure?'treasure_repeat':'treasure_first'}),
    treasure_first:()=>({paras:P('……于是，勇者的心中浮现出正在等待着他回到家中的人的面容。','是的……有人正在等待着他回去。急切地、焦灼地。','……他还在这里做什么？'),choices:[C('勇者望着前方的路，一阵茫然。','mmbranching',{hasTreasure:true})]}),
    treasure_repeat:()=>({paras:P('这些宝藏已经在勇者的口袋里了。'),choices:[C('不过，他当然可以再多拿一些！','mmbranching')]}),
    stay:()=>({paras:P('宝藏有什么用呢？'),choices:[C('他没有再向前追去。','stay_after')]}),
    stay_after:()=>({paras:P('迷宫依旧在缓慢地移动着，墙壁轻轻错位，远处的走廊时隐时现。那扇刻着宝藏符号的门再也没有回来。','不知走了多久，另一扇门缓缓出现在他的面前。','那扇门没有任何装饰，却隐约有一种沉重的气息，从门的另一侧透出来。','门上有一个钥匙孔——'),choices:state.hasKey?[C('伸手插入钥匙','sword_room')]:[C('勇者无法打开这扇门','mmbranching')]}),
    sword_room:()=> state.hasSword ? ({paras:P('勇者伸手插入钥匙，将门推开。','本该有宝剑的房间里空无一物。','那把宝剑正坚实地守护在勇者的背上。'),choices:[C('继续前进','mmbranching')]}) : ({paras:P('勇者伸手插入钥匙，将门推开。','房间的中央，立着一把剑。剑身笔直，泛着冷光。它无比安静地立在那里。','勇者的心脏狂跳起来。','传说中能够刺穿魔王心脏的圣剑——','它就在这里。'),choices:[C('勇者握住了它。','mmbranching',{hasSword:true})]}),
    mmbranching:()=>({paras:P('眼前有两条道路。一条似乎绘制着壁画，而另一条在尽头闪着光。'),choices:[C('查看壁画','mural_room'),C('查看闪光','mirror_room')]}),
    mural_room:()=>({paras:P('这是一个空旷的房间，墙上刻满了壁画。'),choices:[C('无视，前往下一个房间。','name_room'),C('查看壁画','mural_read')]}),
    mural_read:()=>({paras:P('壁画上，漆黑的魔王正在召唤火球。火球从天而降，毁灭着世界。','这是勇者熟悉的魔王预言。'),choices:[C('回忆片刻','mural_memory')]}),
    mural_memory:()=>({paras:P('这是非常古早的预言了。勇者是为了这个，才前来讨伐魔王的。'),choices:[C('前往下一个房间','name_room')]}),
    mirror_room:()=>({paras:P('这个房间里放着大量的镜子……那些光芒原来是镜子反射的光。','镜子里的人当然是勇者。'),choices:[C('观察镜子','mirror_observe')]}),
    mirror_observe:()=>{
      const extra=[];
      if(state.hasKey) extra.push('没有那把金色的钥匙。');
      if(state.hasSword) extra.push('没有泛着银光的圣剑。');
      if(state.hasTreasure) extra.push('噢！甚至没有身上这些闪亮亮的财宝。太遗憾了。');
      if(state.callsName) extra.push('……镜中勇者，似乎在被什么人呼唤着。');
      if(!state.hasKey&&!state.hasSword&&!state.hasTreasure&&!state.callsName) extra.push('不，似乎没有什么不同。');
      return {paras:P('勇者忽然觉得很是陌生。镜子里的勇者……',...extra),choices:[C('前往下一个房间','name_room')]};
    },
    name_room:()=>({paras:P('这个房间里摆满了书籍。'),choices:[C('打开一本书','name_book'),...(state.knowsName?[C('回忆你所知道的那个名字。','name_recall')]:[])]}),
    name_book:()=>({paras:P('这是一本温暖的童话故事。','“……名字是奇妙的魔法……”','童话书里这样说。','“我们通过名字呼唤彼此，连接彼此。”'),auto:'corridor'}),
    name_recall:()=>({paras:P('你知道魔王的名字了。这开始对你产生了什么意义吗？'),choices:[C('继续前进','corridor')]}),
    corridor:()=>({paras:P('最后的长廊出现了。就在墙后，一墙之隔的地方。','它一定就在后面。','长廊一共有一左一右两扇门。左边那扇红门死死紧闭，在门上有一个圆盘，似乎，必须要将圆盘拨到正确的符号上，才能打开这道门。','右边的蓝门上有一把银色的巨锁，没有钥匙孔。必须用非常强有力的攻击，才能将其打开。'),choices:[...(state.knowsName?[C('使用圆盘拨出魔王的名字','red')]:[]),...(state.hasSword?[C('用宝剑劈开蓝门','blue')]:[]),...(state.hasTreasure?[C('不进入房间，带着宝藏离开','ending_treasure')]:[]),C('……勇者什么也做不了','ending_loop')]}),
    red:()=>({paras:P('勇者使用圆盘，拨出了他所听过的魔王的名字，门缓缓开启。'),choices:[C('进入房间。','red_after')]}),
    red_after:()=>({paras:P('房间里有一尊雕像——一把宝剑刺入它的眼睛，魔王正在衰败。','勇者明白了，这就是魔王的弱点——传说中的圣剑，和他的眼睛。'),choices:[C('继续前进','boss',{hasWeak:true})]}),
    blue:()=>({paras:P('圣剑可以劈开这把巨大的锁。于是，勇者得以继续前进。'),choices:[C('继续前进','boss')]}),
    boss:()=>({paras:P('在迷宫城最后的房间中，有一座宝座。宝座上端坐着一具枯骨。','然后，它动了。','枯骨慢慢变成了魔王。'),choices:[...(state.hasWeak&&state.hasSword?[C('用圣剑刺入魔王的眼睛','deadend')]:[]),...(state.hasWeak?[C('攻击魔王的眼睛','attackeye')]:[]),...(state.hasSword?[C('使用圣剑攻击魔王','attack')]:[]),...(state.knowsName?[C('勇者呼唤了他所知道的那个名字','call')]:[]),C('勇者僵硬在地，无法做出反应','ending_loop'),...(state.callsName?[C('等等，它似乎……记得你？','truthend')]:[])]}),
    call:()=>({onEnter:()=>{state.callsName=true},paras:P('勇者呼喊出了魔王的名字。魔王似乎有一瞬间的迟疑。','但是，下一瞬间，漆黑的光明残酷地扫了过来，切割开勇者的身体。','他的世界陷入漆黑一片。'),choices:[C('继续前进','start')]}),
    attack:()=>({paras:P('勇者的宝剑刺穿了魔王的身体，但是，被刺穿的地方却在复合。','可恶！'),choices:[C('勇者愤怒地大喊。','attack_after')]}),
    attack_after:()=>({paras:P('为什么会这样？难道魔王就是无法击败的吗？','不，一定有什么办法……','下一瞬间，一束黑光残酷地扫了过来，切割开勇者的身体。','他的世界陷入漆黑一片。'),choices:[C('继续前进','start')]}),
    attackeye:()=>({paras:P('勇者的剑刺向魔王的眼睛，但是，就好像眼前有一只无形的手牢牢握住了勇者的剑一样，无论如何都无法继续下刺。'),choices:[C('勇者愤怒地大喊。','attackeye_after')]}),
    attackeye_after:()=>({paras:P('为什么会这样？难道是因为他没有拿到那柄圣剑吗？','一定有什么办法……','下一瞬间，一束黑光残酷地扫了过来，切割开勇者的身体。','他的世界陷入漆黑一片。'),choices:[C('继续前进','start')]}),
    ending_loop:()=>({paras:P('勇者继续无法前进了。这两扇门死死堵住了他的去路。','他不知道自己该怎么办，但是，也无法就这样离去……','又饿又渴之中，他渐渐地被黑暗包裹，失去了意识，然后……'),choices:[C('继续前进','start')]}),
    ending_treasure:()=>({paras:P('看着手里的宝藏，勇者忽然觉得疑惑。','为什么要继续前进呢？它不是已经得到冒险之初他想要的财富了吗？','现在，只要回头就好了。','勇者没有能够推开任何一扇门。'),choices:[C('他转身离去','ending_treasure_final')]}),
    ending_treasure_final:()=>({paras:P('他转身离去,再也没有回来过。'),ending:'幸福的终点'}),
    deadend:()=>({paras:P('宝剑刺入他的眼睛，他浑身颤抖，皮肤从裂开的伤口开始汽化。','“……你……”','魔王最后望着勇者，似乎想说些什么，但是他的嘴唇已经裂开，啪嗒地掉了下来。','它再也无法发出任何声音，直到最后，它的每一寸皮肤都蒸发殆尽——','只剩下最初被刺入的那双眼睛，咕噜噜地滚到地上，似乎还在不甘地看着勇者'),choices:[C('……勇者完成了使命。','deadend_final')]}),
    deadend_final:()=>({paras:P('勇者成为了英雄。'),ending:'你是英雄'}),
    truthend:()=>({paras:P('勇者站在原地，没有举起剑。'),choices:[C('看着王座上的那个人。','truthend_2')]}),
    truthend_2:()=>({paras:P('“我知道你的名字。”他说。','那一瞬间，魔王的动作停住了。它慢慢地看向勇者，“我好像也记得你。”','“已经不是第一次了，对吗？”他说，“我们之前也见过。”'),choices:[C('“是的。我想杀你，但最终你杀了我。”','truthend_3')]}),
    truthend_3:()=>({paras:P('魔王叹了一口气。','“为什么？”','“为什么我们必须这样不可？”'),choices:[C('“……你是魔王。”勇者迟疑着，“你在问什么？”','truthend_4')]}),
    truthend_4:()=>({paras:P('“是啊，我是魔王。”他点点头，“……预言上我会毁灭一切。所以，不断地有人来毁灭我——当然，我也必须毁灭他们。”'),choices:[C('勇者皱起了眉，“谁写的预言？”','truthend_5')]}),
    truthend_5:()=>({paras:P('魔王摇了摇头，“不知道。”','房间里重新安静下来。没有一丝声音——勇者能听见的，只有剑的嗡鸣。'),choices:[C('勇者袭击向魔王','attack'),...(state.hasWeak&&state.hasSword?[C('用圣剑刺入魔王的眼睛','deadend')]:[]),...(state.hasWeak?[C('攻击魔王的眼睛','attackeye')]:[]),...(state.hasSword?[C('使用圣剑攻击魔王','attack')]:[]),C('“……如果我们不这么做呢？”勇者问。','leave_with_demon')]}),
    leave_with_demon:()=>({paras:P('魔王看着他。'),choices:[C('“我们一起离开”','leave_2')]}),
    leave_2:()=>({paras:P('“我们一起离开。”勇者说，“去看看外面的世界，去看看是谁写下了这个预言，看看你是不是真的非要毁灭一切不可，我们去看看……我已经离开家里太久了。我想回家。我想念我的家乡，我的家人。”','……','。','“你的家乡是什么样？”魔王问。'),choices:[C('“很漂亮。”','leave_3')]}),
    leave_3:()=>({paras:P('“很漂亮。”勇者说，“有金色的麦田，每天早晨，大街小巷都会弥漫面包房新出炉面包的香气。有扎着小辫子的孩子成群结队地在街上奔跑，笑着对你打招呼……”','“听起来很漂亮……我也想看看。”魔王说。','它走下王座，牵起了你的手。','于是，迷宫城的大门打开了。'),ending:'命运的朋友'})
  };

  function C(label,next,set){ return {label,next,set:set||null}; }
  function appendBlock(paras){
    if(!paras || !paras.length) return;
    const block=document.createElement('div'); block.className='story-block';
    paras.forEach(text=>{const p=document.createElement('p');p.textContent=text;block.appendChild(p)});
    storyEl.appendChild(block);
  }
  function appendChoices(choices){
    if(!choices || !choices.length) return;
    const group=document.createElement('div'); group.className='choice-group story-block';
    choices.forEach(ch=>{
      const btn=document.createElement('button'); btn.type='button'; btn.className='choice'; btn.textContent=ch.label;
      btn.addEventListener('click',()=>{
        if(locked) return; locked=true;
        [...group.querySelectorAll('.choice')].forEach(b=>b.disabled=true); btn.classList.add('selected');
        if(ch.set) Object.assign(state,ch.set);
        setTimeout(()=>{locked=false; render(ch.next);},110);
      });
      group.appendChild(btn);
    });
    storyEl.appendChild(group);
  }
  function appendEnding(name){
    const box=document.createElement('div'); box.className='ending story-block';
    box.innerHTML='<span>结局</span><strong></strong>'; box.querySelector('strong').textContent=name;
    const btn=document.createElement('button');btn.className='restart-inline';btn.type='button';btn.textContent='重新开始';btn.addEventListener('click',restart);box.appendChild(btn);storyEl.appendChild(box);
  }
  function render(id){
    const make=scenes[id]; if(!make) return;
    const scene=make(); if(scene.onEnter) scene.onEnter();
    appendBlock(scene.paras); appendChoices(scene.choices); if(scene.ending) appendEnding(scene.ending);
    if(scene.auto) render(scene.auto);
    requestAnimationFrame(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
  }
  function restart(){state=initialState();locked=false;storyEl.innerHTML='';window.scrollTo({top:0,behavior:'auto'});render('start');}
  restartBtn.addEventListener('click',restart); restart();
})();
