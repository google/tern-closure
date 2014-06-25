'use strict';
var infer = require('tern/lib/infer');


/**
 * A constraint for specifying that an AVal is the instance of the superclass of
 * the target function type (i.e. the AVal object type should be used as the
 * function's prototype's proto).
 */
exports.IsParentInstance = infer.constraint('childCtor', {
  addType: function(parentInstanceType, weight) {
    // TODO: Set up Class.base to point to parent class.
    if (!(parentInstanceType instanceof infer.Obj) ||
        !this.childCtor.hasProp('prototype', false)) {
      return;
    }
    var childProtoType = this.childCtor.getProp('prototype').getType();
    if (!(childProtoType instanceof infer.Obj)) {
      console.log('Forcing proto on non-object!');
      return;
    }
    // Detach the old proto and replace it with the new one.
    if (childProtoType.proto.onNewProp) {
      childProtoType.proto.unregPropHandler(childProtoType);
      parentInstanceType.forAllProps(childProtoType);
    }
    childProtoType.proto = parentInstanceType;

    // Set up for inheritance of type information for overriden methods.
    childProtoType.forAllProps(function(prop, val, local) {
      if (local) {
        // For each child method, look for overriden methods up the prototype
        // chain.
        var protoPropVal = childProtoType.proto.hasProp(prop);
        if (protoPropVal && !val._closureHasParent) {
          protoPropVal.propagate(new IsParentMethod(val));
          val._closureHasParent = true;
        }
      } else {
        // As properties are added up the chain (parent classes are loaded),
        // watch for overriden methods.
        var localPropVal =
            childProtoType.hasProp(prop, false /* searchProto */);
        if (localPropVal && !localPropVal._closureHasParent) {
          val.propagate(new IsParentMethod(localPropVal));
          localPropVal._closureHasParent = true;
        }
      }
    });
  }
});


/**
 * A constraint for specifying that a superclass method is overriden by the
 * target method AVal. This sets up forwarding of parameter types, return types,
 * and description information.
 */
var IsParentMethod = infer.constraint('childMethod', {
  addType: function(parentMethodType, weight) {
    var childMethodType = this.childMethod.getType();
    if (!(childMethodType instanceof infer.Fn) ||
        !(parentMethodType instanceof infer.Fn)) {
      return;
    }
    // TODO: Solve issue with propagating docs further down the chain.
    if (!childMethodType.doc) {
      childMethodType.doc = parentMethodType.doc;
    }
    if (parentMethodType.retval) {
      parentMethodType.retval.propagate(childMethodType.retval);
    }
    if (parentMethodType.args) {
      for (var i = 0; i < parentMethodType.args.length; i++) {
        if (childMethodType.args[i]) {
          parentMethodType.args[i].propagate(childMethodType.args[i]);
        }
      }
    }
  }
});
