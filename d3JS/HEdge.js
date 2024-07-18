// creating variable with all setting value 
var settings = {
  data: [],
  width: 500,
  height: 500,
  radius: 500 / 2,
  innerRadius: 250 - 120,
  curveBeta: 0.85,
  tooltipPosition :1, // Deining top and bottom position by using 1 as top and 0 as bottom.
};
// Defining initial variables for d3 cluster
function inVar() {
  width = Math.min(parent.clientWidth, parent.clientHeight);
    radius = width / 2;
    innerRadius = radius - 120;
    cluster = d3.cluster()
    .size([360, innerRadius]);
    tooltip = d3.tip()
    .attr('class', 'd3-tip '+(settings.tooltipPosition?'':'bottom'))
    .offset([(settings.tooltipPosition ? 0 : 25), 0])
    .html(function (d) {
        return `<div class="tooltip-style">
                        <div>${(getParent(d))}</div>                   
                        <span>${d.outgoing && d.outgoing.length ? d.outgoing.length : ''} outgoing  </span>
                        <span>${d.incoming && d.incoming.length ? d.incoming.length : ''} incoming </span>
                     </div>`;
    });
   
}
// defining parent by svg container by element
var parent = document.getElementById("svgContainer");
var width,
  height,
  radius,
  cluster,
  innerRadius,
  line,tooltip,
  root, link, data, timeout,colorin = "#56a983", colorout = "#f00", colornone = "#ccc",color= d3.scaleOrdinal() 
  .range(d3.schemeDark2);
  inVar();
// Above using scale ordinal Dark 2 color option of D3 to show the pattern in dark
var svg = d3.select("#svgContainer").append("svg");
var appendSvgG = svg.append("g")
  .attr("font-family", "sans-serif")
  .attr("font-size", 10);


function render() {
  svg.attr("width", width).attr("height", width)
  .attr("viewBox", [-width / 2, -width / 2, width, width]);
  
  line = d3.radialLine()
    .curve(d3.curveBundle.beta(settings.curveBeta))
    .radius(d => d.y)
    .angle(d => d.x)

  const newData = hierarchy(JSON.parse(JSON.stringify(data)));
  
  color.domain(newData.children.map(c=>c.name))
  root = cluster(bilink(d3.hierarchy(newData)));
  
  const parentG= appendSvgG.selectAll("g.parentG").data(root.leaves());
  parentG.exit().remove();
  const enterParentG= parentG.enter()
    .append('g')
    .attr('class','parentG').attr('id',(d)=>id(d));

  enterParentG.append("text").attr('class','text');
// Creating constant with multiple attribute to show on the hover and transformation
const updateParentG=enterParentG.merge(parentG); 
updateParentG.attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
updateParentG.selectAll('.text')
.attr('id',(d)=>id(d))
.attr("dy", "0.31em")
.attr("x", d => d.x < Math.PI ? 6 : -6)
.attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
.attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
.text(d => { return d.data.name})
.each(function (d) { d.text = this; })
.on("mouseover", overed)
.on("mouseout", outed)
.call(text => text.append("title").text(d => `${(id(d, " "))}
${d.data['Adjusted Time']}
${d.outgoing && d.outgoing.length ? getPathData(d,'outgoing').length : '0'} outgoing
${d.incoming && d.incoming.length ? getPathData(d,'incoming').length: '0'} incoming`));

const pathG=appendSvgG.selectAll('g.pathG').data([1]);
pathG.exit().remove();
const enterPathG= pathG.enter().append("g");

const updatePG=enterPathG.merge(pathG).attr('class','pathG').attr("stroke", colornone).attr("fill", "none");
const a=root.leaves().flatMap(leaf => leaf.outgoing).filter((v,i)=>{
  return v[0].data.Label===v[1].data.Label
})
link =updatePG.selectAll("path").data(a);
link.exit().remove();
link.enter().append("path").merge(link)
    .attr('id',(d)=>id(d[0]))
    .style("mix-blend-mode", "multiply")
    .attr("d", ([i, o]) => {return line(i.path(o)) })
    .attr('stroke', (d)=>{ return color(d[0].data.Label)})
    .each(function (d) { d.path = this; });
}
function overed(event, d) {
  link.style("mix-blend-mode", null);
  d3.select(this).attr("font-weight", "bold");
  d3.selectAll('path').attr("stroke", null).style("opacity", '0').raise();
  
  let ll=d.data.Label;
  d3.selectAll(d.incoming.map(d =>{  return d.path && d.path.id.split('.')[1] == ll?d.path:'' })).attr("stroke", color(d.data.Label)).style("opacity", '1').raise();
  d3.selectAll(d.incoming.map(([v]) => { return v.text  && v.data.Label == ll? v.text:''})).attr("fill", color(d.data.Label)).style("opacity", '1').attr("font-weight", "bold");
  d3.selectAll(d.outgoing.map(d => {return d.path && d.path.id.split('.')[1] == ll?d.path:''})).attr("stroke",color(d.data.Label)).style("opacity", '0.3').raise();
  d3.selectAll(d.outgoing.map(([, v]) => { return v.text  && v.data.Label == ll? v.text:''})).attr("fill", color(d.data.Label)).style("opacity", '0.3').attr("font-weight", "bold");
}

function outed(event, d) {
  link.style("mix-blend-mode", "multiply");
  d3.select(this).attr("font-weight", null);
  let ll=d.data.Label;
  d3.selectAll(d.incoming.map(d =>{  return d.path && d.path.id.split('.')[1] == ll?d.path:'' })).attr("stroke", null).style("opacity", '1').raise();
  d3.selectAll(d.incoming.map(([v]) => { return v.text  && v.data.Label == ll? v.text:''})).attr("fill", null).style("opacity", '1').attr("font-weight", null);
  d3.selectAll(d.outgoing.map(d => {return d.path && d.path.id.split('.')[1] == ll?d.path:''})).attr("stroke",null).style("opacity", '1').raise();
  d3.selectAll(d.outgoing.map(([, v]) => { return v.text  && v.data.Label == ll? v.text:''})).attr("fill", null).style("opacity", '1').attr("font-weight", null);
  d3.selectAll('path').attr('stroke', (d)=>{  return color(d[0].data.Label)}).style("opacity", '1').raise(); 
}
 

function getPathData(d,path) {
 return d[path].filter(d=>{
    return d[0].data.Label === d[1].data.Label;
  })  
}
function getTextData(d,path='incoming') {
  let ll=d.data.Label;
 return d[path].filter(d=>{
    return d.path && d.path.id.split('.')[1] == ll;
  })  
}

// Hierarchy function to get complete structure of data and delimeter
function hierarchy(data, delimiter = ".") {
  let root;
  const map = new Map;
  data.forEach(function find(data) {
    const { name } = data;
    if (map.has(name)) return map.get(name);
    const i = name.lastIndexOf(delimiter);
    map.set(name, data);
    if (i >= 0) {
      find({name: name.substring(0, i), children: []}).children.push(data);
      data.name = name.substring(i + 1);
    } else {
      root = data;
    }
    return data;
  });
  return root;
}
function bilink(root) {
  const map = new Map(root.leaves().map(d => [id(d), d]));  
  for (const d of root.leaves()) { d.incoming = [],d.outgoing = d.data.imports.filter(i=>map.get(i)).map(i => [d, map.get(i)])};
  for (const d of root.leaves()) for (const o of d.outgoing) o[1]?.incoming.push(o);
  return root;
}
function id(node,pre=".") {
  return `${node.parent ? id(node.parent) + pre : ""}${node.data.name}`;
}


let objDuplicate = {};

d3.csv("./intraction_summary_data.csv", function (obj) {
  let name = obj['Source Label'];
  let target = obj['Target Label'];
  obj.name = 'root.'+obj['Label']+'.'+name;
  obj.target = target;
  const string='root.'+obj['Label']+'.'+obj.target;
  if (!objDuplicate[name]) { 
    obj.imports=[string];
    objDuplicate[name] = { [target]: obj['Label'],'data':obj };
 
    return obj;
  } else if (objDuplicate[name] && !objDuplicate[name][target]) {
   
    objDuplicate[name].data.imports.push(string)
    obj.imports=objDuplicate[name].data.imports;
    objDuplicate[name] = { [target]: obj['Label'], 'data':obj };

    return obj;
  } else if (objDuplicate[name] && objDuplicate[name][target] && objDuplicate[name][target] !== obj['Label']) {
    objDuplicate[name].data.imports.push(string)
    obj.imports=objDuplicate[name].data.imports;
    objDuplicate[name] = { [target]: obj['Label'], 'data':obj };
    return obj;
  }

}).then((d) => {
  data = d;
  render();
});
// even resizing function
window.addEventListener("resize", function () {
  clearTimeout(timeout);
  timeout = setTimeout(function () {
    clearTimeout(timeout);
    timeout = undefined;
    inVar();
    render();
  }, 100);
});
