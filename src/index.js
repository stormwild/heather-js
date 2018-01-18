import axios from 'axios'
import _ from 'lodash'

const minimum_data = { data: {} }

export default class Client {
  constructor(base_url){
    this.base_url = base_url
  }

  build_request({ method = '', data = minimum_data, meta = {} } = {}){
    const headers = this.build_headers()

    return {
      base_url: this.base_url,
      method,
      headers,
      data,
      meta
    }
  }

  build_headers(){
    return {
      'Content-Type': 'application/vnd.api+json'
    }
  }

  build_data({ resource, type, attributes = [] }){
    let result = minimum_data

    result.data.type = type || resource.constructor.name.toLowerCase()

    if (resource) {
      if(resource.id) {
        result.data.id = resource.id
      }
      result.data.attributes = {}

      _.forOwn(resource, (value, property) => {
        if(property !== 'id' && (_.isEmpty(attributes) || _.includes(attributes, property))) {
          result.data.attributes[property] = value
        }
      })
    }
    return result
  }

  build_request_find({type, id = 0, meta} = {}){
    const resource = { id }
    const data = this.build_data({ resource, type })
    return this.build_request({method: 'GET', data, meta})
  }

  build_request_find_all(){
    return this.build_request({method: 'GET'})
  }

  build_request_update({ resource, type, attributes }){
    const data = this.build_data({resource, type, attributes})
    return this.build_request({method: 'PATCH', data})
  }

  build_request_create({ resource, type, attributes }){
    return this.build_request({method: 'POST'})
  }

  build_request_delete(){
    return this.build_request({method: 'DELETE'})
  }

  // These were split into the method and a build method to be able to test the
  // requests without mocking the network
  find(params){
    return new Promise((resolve, reject) => {
      axios(this.build_request_find(params)).then(
        response => resolve(this.deserialize(response.data))
      ).catch(
        error => reject(error)
      )
    })
  }

  find_all(params){
    return new Promise((resolve, reject) => {
      axios(this.build_request_find_all(params)).then(
        response => resolve(this.deserialize_array(response.data))
      ).catch(
        error => reject(error)
      )
    })
  }

  update(params){
    return new Promise((resolve, reject) => {
      axios(this.build_request_update(params)).then(
        response => resolve(this.deserialize(response.data))
      ).catch(
        error => reject(error)
      )
    })
  }

  create(params){
    return new Promise((resolve, reject) => {
      axios(this.build_request_create(params)).then(
        response => resolve(this.deserialize(response.data))
      ).catch(
        error => reject(error)
      )
    })
  }

  delete(params){
    return new Promise((resolve, reject) => {
      axios(this.build_request_delete(params)).then(
        response => resolve(this.deserialize(response.data))
      ).catch(
        error => reject(error)
      )
    })
  }

  //Allow requests not necessarily in JSON API.
  custom_request(request){
    return axios(request)
  }

  deserialize(data, klass){
    let obj;
    if(klass) {
      obj = new klass()
    } else {
      obj = {type: data.type}
    }
    obj.id = data.id
    _.forEach(data.attributes, (value, key) => {
      obj[key] = value;
    })

    return obj
  }

  deserialize_array(data, klass){
    return _.map(data, elem => this.deserialize(elem, klass))
  }
}
